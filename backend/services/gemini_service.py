import os
import json
import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("proofhire.gemini")

class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        self.model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    def set_api_key(self, api_key: str):
        self.api_key = api_key

    def has_valid_key(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "your_gemini_api_key_here")

    def generate_json(self, prompt: str, system_instruction: str = "") -> Optional[Dict[str, Any]]:
        """
        Calls Gemini API with JSON output enforcement.
        If key missing or API fails, returns None so caller can use structured adaptive engine.
        """
        if not self.has_valid_key():
            logger.info("No valid Gemini API key found. Using adaptive fallback engine.")
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        full_system_prompt = (
            system_instruction + "\n\nCRITICAL: Respond ONLY with valid raw JSON object. Do not include markdown code block backticks ```json ... ``` or any text outside the JSON structure."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": full_system_prompt}]
            },
            "generationConfig": {
                "temperature": 0.4,
                "responseMimeType": "application/json"
            }
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        if content_parts:
                            text = content_parts[0].get("text", "")
                            # Clean potential markdown block wrapping if present
                            clean_text = text.strip()
                            if clean_text.startswith("```"):
                                lines = clean_text.splitlines()
                                if lines[0].startswith("```"):
                                    lines = lines[1:]
                                if lines and lines[-1].startswith("```"):
                                    lines = lines[:-1]
                                clean_text = "\n".join(lines).strip()
                            return json.loads(clean_text)
                else:
                    logger.warning(f"Gemini API returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
        
        return None

# Singleton instance
gemini_client = GeminiService()
