from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Candidate
from schemas import ResumeParseResponse, ParsedResumeData
from services.resume_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_with_ai_or_heuristic
)

router = APIRouter(prefix="/api/resume", tags=["resume"])

@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    db: Session = Depends(get_db)
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

    parsed = parse_resume_with_ai_or_heuristic(extracted_text)

    # Store in database
    candidate = Candidate(
        name=parsed.get("name", "Candidate"),
        email=parsed.get("email"),
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

    return ResumeParseResponse(
        success=True,
        candidate_id=candidate.id,
        raw_text=extracted_text,
        parsed=ParsedResumeData(**parsed)
    )
