from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
from app.schemas.schemas import ResumeParseResponse, ParsedResumeData
from app.services.resume.resume_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_with_ai_or_heuristic
)

router = APIRouter(prefix="/api/resume", tags=["resume"])

@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None)
):
    extracted_text = ""

    if file:
        content_type = file.content_type or ""
        file_bytes = await file.read()
        filename = file.filename.lower() if file.filename else ""

        if "pdf" in content_type or filename.endswith(".pdf"):
            extracted_text = extract_text_from_pdf(file_bytes)
        elif "word" in content_type or "docx" in content_type or filename.endswith(".docx"):
            extracted_text = extract_text_from_docx(file_bytes)
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
    elif raw_text:
        extracted_text = raw_text
    else:
        raise HTTPException(status_code=400, detail="Provide a resume file or raw_text string.")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from provided resume.")

    parsed_data = parse_resume_with_ai_or_heuristic(extracted_text)

    return ResumeParseResponse(
        success=True,
        candidate_id=None,
        raw_text=extracted_text,
        parsed=ParsedResumeData(**parsed_data)
    )
