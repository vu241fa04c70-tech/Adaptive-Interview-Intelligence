from fastapi import APIRouter
from app.services.ai.gemini_service import gemini_client
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "gemini_api_key_configured": gemini_client.has_valid_key(),
        "mode": "gemini_2.5_flash" if gemini_client.has_valid_key() else "adaptive_fallback_engine",
        "model": settings.GEMINI_MODEL
    }
