import os
import json
import logging
from typing import Dict, Any, Optional
from google import genai
from google.genai import types

logger = logging.getLogger("proofhire.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini API Client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                self.client = None

    def has_valid_key(self) -> bool:
        return self.client is not None and bool(self.api_key)

    def generate_json(self, prompt: str, system_instruction: str = "") -> Optional[Dict[str, Any]]:
        if not self.has_valid_key():
            return None

        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
                system_instruction=system_instruction if system_instruction else None
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )

            if response and response.text:
                clean_text = response.text.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
                elif clean_text.startswith("```"):
                    clean_text = clean_text.split("```", 1)[1].rsplit("```", 1)[0].strip()
                return json.loads(clean_text)
        except Exception as e:
            logger.warning(f"Gemini API generation failed: {e}. Falling back to adaptive rule engine.")
            return None
        return None

gemini_client = GeminiService()
