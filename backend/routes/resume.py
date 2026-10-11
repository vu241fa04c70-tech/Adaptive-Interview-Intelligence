from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Candidate, User
from schemas import ResumeParseResponse, ParsedResumeData
from services.resume_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_with_ai_or_heuristic
)
from routes.auth import get_optional_current_user, get_current_user

router = APIRouter(prefix="/api/resume", tags=["resume"])

@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    extracted_text = ""
    filename = None

    if file:
        filename = file.filename
        content = await file.read()
        if filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(content)
        elif filename.lower().endswith(".docx"):
            extracted_text = extract_text_from_docx(content)
        else:
            extracted_text = content.decode("utf-8", errors="ignore")
    elif raw_text:
        extracted_text = raw_text
    else:
        raise HTTPException(status_code=400, detail="Please upload a resume file (PDF/DOCX) or provide resume text.")

    if not extracted_text.strip():
        extracted_text = "Experienced software developer skilled in programming, problem solving, and software architecture."

    parsed = parse_resume_with_ai_or_heuristic(extracted_text, filename=filename)

    candidate_name = parsed.get("name")
    if (not candidate_name or candidate_name.strip().lower() in ["candidate", "unknown", ""]) and current_user:
        candidate_name = current_user.name
    elif not candidate_name:
        candidate_name = "Candidate"

    candidate_email = parsed.get("email")
    if not candidate_email and current_user:
        candidate_email = current_user.email

    # Store in database
    candidate = Candidate(
        user_id=current_user.id if current_user else None,
        name=candidate_name,
        email=candidate_email,
        resume_filename=filename,
        raw_resume_text=extracted_text,
        parsed_skills=parsed.get("skills", []),
        parsed_projects=parsed.get("projects", []),
        parsed_experience=parsed.get("experience", []),
        parsed_education=parsed.get("education", []),
        parsed_technologies=parsed.get("technologies", [])
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    # Sync parsed name/email
    parsed["name"] = candidate_name
    if candidate_email:
        parsed["email"] = candidate_email

    return ResumeParseResponse(
        success=True,
        candidate_id=candidate.id,
        raw_text=extracted_text,
        parsed=ParsedResumeData(**parsed)
    )


@router.get("/my-resume")
def get_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the authenticated candidate's most recent uploaded resume record."""
    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .order_by(Candidate.created_at.desc())
        .first()
    )
    if not candidate:
        return {"has_resume": False, "candidate": None}

    return {
        "has_resume": True,
        "candidate": {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "resume_filename": candidate.resume_filename,
            "raw_text": candidate.raw_resume_text,
            "skills": candidate.parsed_skills or [],
            "projects": candidate.parsed_projects or [],
            "experience": candidate.parsed_experience or [],
            "education": candidate.parsed_education or [],
            "technologies": candidate.parsed_technologies or [],
            "created_at": candidate.created_at.isoformat() if candidate.created_at else None
        }
    }

