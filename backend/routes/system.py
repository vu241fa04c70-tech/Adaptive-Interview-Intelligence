from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_service import gemini_client
from models import User
from routes.auth import get_current_admin_user

router = APIRouter(prefix="/api/system", tags=["system"])

class ApiKeyVerifyRequest(BaseModel):
    api_key: str

@router.get("/status")
def get_system_status():
    verification = gemini_client.verify_connection()
    is_connected = verification.get("connected", False)
    return {
        "status": "healthy",
        "ai_connected": is_connected,
        "ai_message": verification.get("reason", "Operational"),
        "model": verification.get("model") if is_connected else None,
        "mode": "live_gemini" if is_connected else "adaptive_fallback_engine",
        # Keep backward compatibility flag for older consumers:
        "gemini_api_key_configured": is_connected
    }

@router.post("/verify-key")
def verify_api_key(
    req: ApiKeyVerifyRequest,
    current_admin: User = Depends(get_current_admin_user)
):
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API Key cannot be empty.")
    
    gemini_client.set_api_key(key)
    verification = gemini_client.verify_connection()
    if verification.get("connected"):
        return {
            "success": True,
            "message": "AI service connected and verified successfully!",
            "model": verification.get("model")
        }
    
    return {
        "success": False,
        "message": f"Verification failed: {verification.get('reason', 'Could not connect to Gemini service')}"
    }

@router.get("/presets")
def get_sample_presets():
    """
    1-click realistic candidate presets for easy testing!
    """
    return [
        {
            "id": "alex_python",
            "candidate_name": "Alex Chen",
            "candidate_email": "alex.chen@example.com",
            "role": "Python Developer Intern",
            "target_difficulty": "intermediate",
            "duration_minutes": 20,
            "interview_type": "mixed",
            "parsed_skills": ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Docker", "PyTest", "Git"],
            "parsed_projects": [
                {
                    "title": "Real-time Order Processing Engine",
                    "description": "Built an asynchronous order processing pipeline handling 2,000 req/sec with FastAPI and Redis pub/sub.",
                    "technologies": ["Python", "FastAPI", "Redis", "Docker"]
                }
            ],
            "raw_resume_text": "Alex Chen\nPython Developer Intern candidate with 2+ years of academic and project experience building asynchronous backend APIs, database models, and unit test suites.",
            "job_title": "Python Developer Intern",
            "job_description_text": "We are seeking a Python Developer Intern to build scalable backend microservices, write clean REST APIs with FastAPI/Django, write comprehensive PyTest suites, and optimize SQL queries."
        },
        {
            "id": "maya_frontend",
            "candidate_name": "Maya Lin",
            "candidate_email": "maya.lin@example.com",
            "role": "Frontend Developer",
            "target_difficulty": "intermediate",
            "duration_minutes": 20,
            "interview_type": "mixed",
            "parsed_skills": ["React", "TypeScript", "Tailwind CSS", "Redux Toolkit", "Next.js", "Jest", "Web Performance"],
            "parsed_projects": [
                {
                    "title": "Interactive Analytics Dashboard",
                    "description": "Created a dynamic data visualization dashboard using React, Recharts, and WebSockets with virtualized list rendering.",
                    "technologies": ["React", "TypeScript", "Recharts", "Tailwind CSS"]
                }
            ],
            "raw_resume_text": "Maya Lin\nFrontend Developer specialized in modern React, TypeScript, responsive Tailwind interfaces, and browser performance optimization.",
            "job_title": "Frontend Developer",
            "job_description_text": "Seeking a Frontend Developer experienced in React, TypeScript, Tailwind CSS, component state architecture, accessible UI design, and responsive dashboards."
        },
        {
            "id": "rahul_ml",
            "candidate_name": "Rahul Sharma",
            "candidate_email": "rahul.sharma@example.com",
            "role": "Machine Learning Engineer",
            "target_difficulty": "advanced",
            "duration_minutes": 30,
            "interview_type": "technical",
            "parsed_skills": ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "MLOps", "Computer Vision"],
            "parsed_projects": [
                {
                    "title": "Defect Detection Vision Model",
                    "description": "Trained ResNet-50 vision model achieving 96.4% F1-score for manufacturing quality control.",
                    "technologies": ["PyTorch", "OpenCV", "Docker", "MLflow"]
                }
            ],
            "raw_resume_text": "Rahul Sharma\nMachine Learning Engineer focusing on deep learning model architecture, PyTorch training pipelines, feature engineering, and model deployment.",
            "job_title": "Machine Learning Engineer",
            "job_description_text": "Looking for a Machine Learning Engineer to design, train, and deploy production ML models, conduct feature engineering, and optimize inference latency."
        }
    ]
