import os
from dotenv import load_dotenv

# Automatically load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
load_dotenv()

class Settings:
    PROJECT_NAME: str = "ProofHire AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # =========================================================================
    # 🔑 GEMINI API CONFIGURATION
    # Read securely from backend environment variable GEMINI_API_KEY (.env)
    # =========================================================================
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash").strip()
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./proofhire.db")
    PORT: int = int(os.environ.get("PORT", 8000))

settings = Settings()

