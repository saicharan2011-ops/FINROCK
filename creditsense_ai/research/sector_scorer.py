import os
import json
from openai import OpenAI
from typing import Dict, Any

class SectorScorer:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.environ.get("HF_TOKEN", ""),
            base_url=os.environ.get("API_BASE_URL", "https://api.groq.com/openai/v1")
        )
        self.model = os.environ.get("MODEL_NAME", "llama-3.1-8b-instant")

    def analyze_sector(self, sector_name: str) -> Dict[str, Any]:
        """
        Query the LLM for a structured JSON analysis of the Indian macro-environment.
        Returns risk_score (0.0-1.0), top_risks (list), and outlook (Positive/Neutral/Negative).
        """
        system_prompt = """You are a top-tier Indian macroeconomic risk analyst.
Analyze the given sector and return ONLY a raw JSON dictionary exactly strictly following this structure:
{
  "risk_score": 0.0,
  "top_risks": ["Risk 1", "Risk 2"],
  "outlook": "Negative"
}
Output only JSON."""
        user_prompt = f"Analyze the macroeconomic risk for the sector: {sector_name}"
        try:
             response = self.client.chat.completions.create(
                  model=self.model,
                  messages=[
                       {"role": "system", "content": system_prompt},
                       {"role": "user", "content": user_prompt}
                  ],
                  temperature=0.0,
                  max_tokens=200
             )
             raw_content = response.choices[0].message.content
             
             if "```json" in raw_content:
                 raw_content = raw_content.split("```json")[1].split("```")[0].strip()
             elif "```" in raw_content:
                 raw_content = raw_content.split("```")[1].strip()

             data = json.loads(raw_content)
             return {
                 "risk_score": max(0.0, min(1.0, float(data.get("risk_score", 0.5)))),
                 "top_risks": data.get("top_risks", [])[:5],
                 "outlook": data.get("outlook", "Neutral")
             }
        except Exception as e:
             return {
                 "risk_score": 0.5,
                 "top_risks": [f"Unable to fetch sector risks: {e}"],
                 "outlook": "Neutral"
             }
