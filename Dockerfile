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

# Copy ALL application code (inference.py, credit_env.py, creditsense_ai/, etc.)
COPY . /app

# Default command: run inference.py for OpenEnv Phase-2 evaluation.
# The evaluator expects [START]/[STEP]/[END] structured output on stdout.
CMD ["python", "inference.py"]
