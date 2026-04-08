FROM node:20-alpine AS frontend-builder

WORKDIR /web
COPY creditsense-frontend/package*.json ./
RUN npm ci
COPY creditsense-frontend/ ./
RUN npm run build

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for common C-extensions (numpy/scipy, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Install Python deps first for better layer caching
COPY creditsense_ai/requirements.txt /app/creditsense_ai/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/creditsense_ai/requirements.txt

# Copy application code
COPY . /app
COPY --from=frontend-builder /web/dist /app/creditsense-frontend/dist

EXPOSE 8501

# FastAPI serves API + built React frontend on the same origin/port.
CMD ["uvicorn", "creditsense_ai.api:app", "--host", "0.0.0.0", "--port", "8501"]
