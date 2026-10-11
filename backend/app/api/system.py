from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai.gemini_service import gemini_client
from app.core.config import settings

router = APIRouter(prefix="/api/system", tags=["system"])

class VerifyKeyRequest(BaseModel):
    api_key: str

@router.get("/status")
def system_status():
    return {
        "status": "healthy",
        "gemini_api_key_configured": gemini_client.has_valid_key(),
        "mode": "gemini_2.5_flash" if gemini_client.has_valid_key() else "adaptive_fallback_engine",
        "model": settings.GEMINI_MODEL
    }

@router.post("/verify-key")
def verify_api_key(req: VerifyKeyRequest):
    if not req.api_key or not req.api_key.strip():
        return {"success": False, "message": "API Key cannot be empty."}
    if len(req.api_key.strip()) > 20:
        return {"success": True, "message": "API Key formatted successfully."}
    return {"success": False, "message": "Invalid Gemini API Key format."}

@router.get("/presets")
def get_preset_candidates():
    return [
        {
            "id": "alex-chen-python",
            "candidate_name": "Alex Chen",
            "candidate_email": "alex.chen@example.com",
            "role": "Python Developer",
            "target_difficulty": "intermediate",
            "duration_minutes": 20,
            "interview_type": "mixed",
            "parsed_skills": ["Python", "FastAPI", "SQL", "Docker", "REST API"],
            "parsed_projects": [
                {
                    "title": "API Gateway Service",
                    "description": "High-throughput API gateway built with FastAPI and Redis",
                    "technologies": ["Python", "FastAPI", "Redis"]
                }
            ],
            "raw_resume_text": "Alex Chen\nPython Developer Intern...",
            "job_title": "Python Developer",
            "job_description_text": "We are seeking a Python Developer proficient in FastAPI, SQL databases, and asynchronous programming."
        },
        {
            "id": "maya-lin-frontend",
            "candidate_name": "Maya Lin",
            "candidate_email": "maya.lin@example.com",
            "role": "Frontend Developer",
            "target_difficulty": "intermediate",
            "duration_minutes": 20,
            "interview_type": "technical",
            "parsed_skills": ["JavaScript", "TypeScript", "React", "Tailwind CSS", "Redux"],
            "parsed_projects": [
                {
                    "title": "Real-time Analytics Dashboard",
                    "description": "Interactive analytics dashboard using React and WebSockets",
                    "technologies": ["React", "TypeScript", "WebSockets"]
                }
            ],
            "raw_resume_text": "Maya Lin\nFrontend Developer...",
            "job_title": "Frontend Developer",
            "job_description_text": "Looking for a React & TypeScript developer with expertise in state management and web accessibility."
        },
        {
            "id": "rahul-sharma-ml",
            "candidate_name": "Rahul Sharma",
            "candidate_email": "rahul.sharma@example.com",
            "role": "Machine Learning Engineer",
            "target_difficulty": "advanced",
            "duration_minutes": 30,
            "interview_type": "mixed",
            "parsed_skills": ["Python", "PyTorch", "Scikit-Learn", "Pandas", "MLOps"],
            "parsed_projects": [
                {
                    "title": "Customer Churn Predictor",
                    "description": "End-to-end ML classification pipeline with MLflow tracking",
                    "technologies": ["Python", "Scikit-Learn", "MLflow"]
                }
            ],
            "raw_resume_text": "Rahul Sharma\nML Engineer...",
            "job_title": "Machine Learning Engineer",
            "job_description_text": "Hiring an ML engineer skilled in model training, feature engineering, and deploying models to production."
        }
    ]
