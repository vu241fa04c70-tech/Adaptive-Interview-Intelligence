import os
import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("proofhire.gemini")

class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key
            or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
            or getattr(settings, "GEMINI_API_KEY", "")
        ).strip()
        self.model = os.environ.get("GEMINI_MODEL", getattr(settings, "GEMINI_MODEL", "gemini-flash-lite-latest"))

    def set_api_key(self, api_key: str):
        self.api_key = api_key.strip()
        self._last_check_time = 0

    def has_valid_key(self) -> bool:
        return bool(self.api_key and self.api_key != "your_gemini_api_key_here")

    def verify_connection(self) -> Dict[str, Any]:
        """
        Actively verifies if the configured Gemini service is operational.
        Caches verification for 60 seconds to avoid latency on repeated checks.
        """
        import time
        now = time.time()
        if hasattr(self, "_last_check_time") and hasattr(self, "_last_check_result"):
            if now - self._last_check_time < 60.0:
                return self._last_check_result

        if not self.has_valid_key():
            res = {
                "connected": False,
                "reason": "GEMINI_API_KEY environment variable not configured",
                "model": None
            }
            self._last_check_time = now
            self._last_check_result = res
            return res

        try:
            # Minimal probe to verify Gemini availability
            test_res = self.generate_json("Respond with {\"status\": \"ok\"}", "System verification test")
            if test_res and test_res.get("status") == "ok":
                res = {
                    "connected": True,
                    "reason": "AI service connected and verified",
                    "model": self.model
                }
            else:
                reason_msg = getattr(self, "_last_error", None) or "AI service returned unexpected verification response"
                res = {
                    "connected": False,
                    "reason": reason_msg,
                    "model": self.model
                }
        except Exception as e:
            res = {
                "connected": False,
                "reason": f"Connection error: {str(e)}",
                "model": self.model
            }

        self._last_check_time = now
        self._last_check_result = res
        return res

    def generate_json(self, prompt: str, system_instruction: str = "") -> Optional[Dict[str, Any]]:
        """
        Calls Gemini API with JSON output enforcement.
        If key missing or API fails, returns None so caller can use structured adaptive engine.
        """
        if not self.has_valid_key():
            logger.info("No valid Gemini API key found. Using adaptive fallback engine.")
            return None

        # Candidate models to try in sequence with priority on high-availability models
        candidate_models = [self.model, "gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"]
        # Remove duplicates preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        full_system_prompt = (
            system_instruction + "\n\nCRITICAL: Respond ONLY with valid raw JSON object. Do not include markdown code block backticks ```json ... ``` or any text outside the JSON structure."
        )

        for model_name in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
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
                with httpx.Client(timeout=8.0) as client:
                    res = client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            content_parts = candidates[0].get("content", {}).get("parts", [])
                            if content_parts:
                                text = content_parts[0].get("text", "")
                                clean_text = text.strip()
                                if clean_text.startswith("```"):
                                    lines = clean_text.splitlines()
                                    if lines[0].startswith("```"):
                                        lines = lines[1:]
                                    if lines and lines[-1].startswith("```"):
                                        lines = lines[:-1]
                                    clean_text = "\n".join(lines).strip()
                                return json.loads(clean_text)
                    elif res.status_code == 429:
                        self._last_error = "Gemini API quota exceeded (429). Using adaptive fallback engine."
                        logger.warning("Gemini API quota exceeded (429). Using adaptive fallback engine without blocking.")
                        return None
                    else:
                        logger.warning(f"Gemini API ({model_name}) returned status {res.status_code}")
            except Exception as e:
                logger.error(f"Error calling Gemini API ({model_name}): {e}")
        
        return None

# Singleton instance
gemini_client = GeminiService()
