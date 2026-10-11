from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from database import get_db
from models import User, Candidate, SkillAnalysis, LearningRoadmap, UserSkillProgress
from routes.auth import get_current_user, get_optional_current_user
from services.skill_gap_service import (
    SUPPORTED_ROLES,
    CATEGORY_LABELS,
    analyze_candidate_skills,
    compare_multiple_roles,
    generate_learning_roadmap,
    get_skill_quiz,
    evaluate_quiz_submission,
    categorize_skill,
    normalize_skill_name
)
from services.resume_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_with_ai_or_heuristic
)

router = APIRouter(prefix="/api/skill-gap", tags=["skill-gap"])

@router.get("/roles")
def get_supported_roles():
    """Returns supported target job roles and skill category taxonomy."""
    return {
        "supported_roles": SUPPORTED_ROLES,
        "categories": CATEGORY_LABELS
    }

@router.post("/analyze")
async def analyze_skills(
    target_role: str = Form(...),
    experience_level: str = Form("Intermediate"),
    custom_job_description: Optional[str] = Form(None),
    candidate_id: Optional[int] = Form(None),
    raw_resume_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Performs full skill gap analysis against target role using candidate's uploaded resume,
    stored resume, and past interview evidence.
    """
    candidate = None

    # Option A: User uploaded a new file in this request
    if file:
        filename = file.filename
        content = await file.read()
        extracted_text = ""
        if filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(content)
        elif filename.lower().endswith(".docx"):
            extracted_text = extract_text_from_docx(content)
        else:
            extracted_text = content.decode("utf-8", errors="ignore")

        parsed = parse_resume_with_ai_or_heuristic(extracted_text, filename=filename)
        candidate = Candidate(
            user_id=current_user.id,
            name=current_user.name,
            email=current_user.email,
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

    # Option B: Candidate ID provided
    elif candidate_id:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()

    # Option C: Raw resume text provided directly
    elif raw_resume_text and raw_resume_text.strip():
        parsed = parse_resume_with_ai_or_heuristic(raw_resume_text)
        candidate = Candidate(
            user_id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            resume_filename="pasted_resume.txt",
            raw_resume_text=raw_resume_text,
            parsed_skills=parsed.get("skills", []),
            parsed_projects=parsed.get("projects", []),
            parsed_experience=parsed.get("experience", []),
            parsed_education=parsed.get("education", []),
            parsed_technologies=parsed.get("technologies", [])
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

    # Option D: Reuse user's most recent uploaded resume
    else:
        candidate = (
            db.query(Candidate)
            .filter(Candidate.user_id == current_user.id)
            .order_by(Candidate.created_at.desc())
            .first()
        )

    # Execute gap analysis engine
    analysis_result = analyze_candidate_skills(
        candidate=candidate,
        target_role=target_role,
        experience_level=experience_level,
        custom_jd_text=custom_job_description,
        user_id=current_user.id,
        db=db
    )

    # Save to SkillAnalysis database table
    new_analysis = SkillAnalysis(
        user_id=current_user.id,
        target_role=target_role,
        experience_level=experience_level,
        custom_job_description=custom_job_description,
        overall_match_percentage=analysis_result["overall_match_percentage"],
        readiness_status=analysis_result["readiness_status"],
        extracted_skills=analysis_result["extracted_skills"],
        skill_breakdown=analysis_result["skill_breakdown"],
        summary=analysis_result["summary"],
        critical_gaps_count=analysis_result["critical_gaps_count"],
        interview_demonstrated_skills=analysis_result["strengths"]
    )
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)

    # Seed UserSkillProgress items for identified gaps
    for item in analysis_result["skill_breakdown"]:
        s_name = item["skill_name"]
        existing_prog = db.query(UserSkillProgress).filter(
            UserSkillProgress.user_id == current_user.id,
            UserSkillProgress.skill_name == s_name
        ).first()

        est_prof = item["estimated_proficiency"] or 1
        req_prof = item["required_proficiency"]
        status = "completed" if (item["gap_level"] == "Strong") else "in_progress" if (est_prof > 1) else "not_started"

        if not existing_prog:
            new_prog = UserSkillProgress(
                user_id=current_user.id,
                skill_name=s_name,
                category=item["category"],
                target_proficiency=req_prof,
                current_proficiency=est_prof,
                status=status,
                checklist=[
                    {"id": "c1", "text": f"Read official documentation & core syntax", "completed": est_prof >= 2},
                    {"id": "c2", "text": f"Implement practical exercises and code examples", "completed": est_prof >= 3},
                    {"id": "c3", "text": f"Deploy a production mini-project or service", "completed": est_prof >= 4},
                    {"id": "c4", "text": f"Pass technical reassessment quiz", "completed": item.get("verified", False)}
                ]
            )
            db.add(new_prog)
    db.commit()

    return {
        "success": True,
        "analysis_id": new_analysis.id,
        "analysis": analysis_result
    }

@router.get("/latest")
def get_latest_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the authenticated user's most recent SkillAnalysis record."""
    latest = (
        db.query(SkillAnalysis)
        .filter(SkillAnalysis.user_id == current_user.id)
        .order_by(SkillAnalysis.created_at.desc())
        .first()
    )
    if not latest:
        return {"has_analysis": False, "analysis": None}

    return {
        "has_analysis": True,
        "analysis_id": latest.id,
        "target_role": latest.target_role,
        "experience_level": latest.experience_level,
        "overall_match_percentage": latest.overall_match_percentage,
        "readiness_status": latest.readiness_status,
        "summary": latest.summary,
        "critical_gaps_count": latest.critical_gaps_count,
        "extracted_skills": latest.extracted_skills,
        "skill_breakdown": latest.skill_breakdown,
        "created_at": latest.created_at.isoformat() if latest.created_at else None
    }

@router.get("/history")
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all historical skill analyses performed by the user."""
    analyses = (
        db.query(SkillAnalysis)
        .filter(SkillAnalysis.user_id == current_user.id)
        .order_by(SkillAnalysis.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "target_role": a.target_role,
            "experience_level": a.experience_level,
            "overall_match_percentage": a.overall_match_percentage,
            "readiness_status": a.readiness_status,
            "critical_gaps_count": a.critical_gaps_count,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in analyses
    ]

@router.post("/compare-roles")
def compare_roles(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compares candidate's resume against up to 3 selected roles side by side."""
    roles = payload.get("roles", ["Python Developer", "Full Stack Developer", "Backend Developer"])
    exp_level = payload.get("experience_level", "Intermediate")
    candidate_id = payload.get("candidate_id")

    candidate = None
    if candidate_id:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    else:
        candidate = (
            db.query(Candidate)
            .filter(Candidate.user_id == current_user.id)
            .order_by(Candidate.created_at.desc())
            .first()
        )

    res = compare_multiple_roles(
        candidate=candidate,
        roles=roles,
        experience_level=exp_level,
        user_id=current_user.id,
        db=db
    )
    return res

@router.post("/generate-roadmap")
def create_roadmap(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates and persists a personalized learning roadmap based on analysis gaps."""
    analysis_id = payload.get("analysis_id")
    daily_commitment = payload.get("daily_commitment", "1h") # 30m, 1h, 2h
    timeline_weeks = int(payload.get("timeline_weeks", 4)) # 2, 4, 8

    # Fetch analysis
    analysis = None
    if analysis_id:
        analysis = db.query(SkillAnalysis).filter(
            SkillAnalysis.id == analysis_id,
            SkillAnalysis.user_id == current_user.id
        ).first()

    if not analysis:
        analysis = (
            db.query(SkillAnalysis)
            .filter(SkillAnalysis.user_id == current_user.id)
            .order_by(SkillAnalysis.created_at.desc())
            .first()
        )

    if not analysis:
        raise HTTPException(status_code=400, detail="Please perform a skill gap analysis first before generating a roadmap.")

    milestones = generate_learning_roadmap(
        skill_breakdown=analysis.skill_breakdown or [],
        target_role=analysis.target_role,
        daily_commitment=daily_commitment,
        timeline_weeks=timeline_weeks
    )

    roadmap = LearningRoadmap(
        user_id=current_user.id,
        analysis_id=analysis.id,
        target_role=analysis.target_role,
        daily_commitment=daily_commitment,
        timeline_weeks=timeline_weeks,
        milestones=milestones
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    return {
        "success": True,
        "roadmap_id": roadmap.id,
        "target_role": roadmap.target_role,
        "daily_commitment": roadmap.daily_commitment,
        "timeline_weeks": roadmap.timeline_weeks,
        "milestones": roadmap.milestones,
        "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None
    }

@router.get("/roadmap")
def get_current_roadmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the user's active learning roadmap."""
    roadmap = (
        db.query(LearningRoadmap)
        .filter(LearningRoadmap.user_id == current_user.id)
        .order_by(LearningRoadmap.created_at.desc())
        .first()
    )
    if not roadmap:
        return {"has_roadmap": False, "roadmap": None}

    return {
        "has_roadmap": True,
        "roadmap_id": roadmap.id,
        "target_role": roadmap.target_role,
        "daily_commitment": roadmap.daily_commitment,
        "timeline_weeks": roadmap.timeline_weeks,
        "milestones": roadmap.milestones,
        "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None
    }

@router.get("/progress")
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all tracked skills, study checklist items, streak, and completion statistics."""
    records = (
        db.query(UserSkillProgress)
        .filter(UserSkillProgress.user_id == current_user.id)
        .order_by(UserSkillProgress.category.asc(), UserSkillProgress.skill_name.asc())
        .all()
    )

    total_count = len(records)
    completed_count = sum(1 for r in records if r.status in ["completed", "verified"] or r.reassessment_passed)
    verified_count = sum(1 for r in records if r.reassessment_passed)
    in_progress_count = sum(1 for r in records if r.status == "in_progress")

    overall_pct = round((completed_count / max(1, total_count)) * 100.0, 1)

    # Calculate active streak days
    max_streak = max([r.streak_days for r in records], default=0)

    items = []
    for r in records:
        items.append({
            "id": r.id,
            "skill_name": r.skill_name,
            "category": r.category,
            "category_label": CATEGORY_LABELS.get(r.category, r.category or "General"),
            "target_proficiency": r.target_proficiency,
            "current_proficiency": r.current_proficiency,
            "status": r.status,
            "notes": r.notes,
            "checklist": r.checklist or [],
            "reassessment_score": r.reassessment_score,
            "reassessment_passed": r.reassessment_passed,
            "reassessment_date": r.reassessment_date.isoformat() if r.reassessment_date else None,
            "streak_days": r.streak_days,
            "last_studied_at": r.last_studied_at.isoformat() if r.last_studied_at else None
        })

    return {
        "total_skills": total_count,
        "completed_count": completed_count,
        "verified_count": verified_count,
        "in_progress_count": in_progress_count,
        "completion_percentage": overall_pct,
        "streak_days": max_streak,
        "skills": items
    }

@router.post("/progress/update")
def update_user_progress(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates status, proficiency, checklist items, or personal notes for a tracked skill."""
    skill_name = payload.get("skill_name")
    if not skill_name:
        raise HTTPException(status_code=400, detail="skill_name is required")

    record = db.query(UserSkillProgress).filter(
        UserSkillProgress.user_id == current_user.id,
        UserSkillProgress.skill_name == skill_name
    ).first()

    if not record:
        record = UserSkillProgress(
            user_id=current_user.id,
            skill_name=skill_name,
            category=payload.get("category", categorize_skill(skill_name)),
            target_proficiency=payload.get("target_proficiency", 3),
            current_proficiency=payload.get("current_proficiency", 1)
        )
        db.add(record)

    if "status" in payload:
        record.status = payload["status"]
    if "current_proficiency" in payload:
        record.current_proficiency = int(payload["current_proficiency"])
    if "notes" in payload:
        record.notes = payload["notes"]
    if "checklist" in payload:
        record.checklist = payload["checklist"]

    # Increment streak & last studied timestamp
    record.last_studied_at = datetime.utcnow()
    record.streak_days = (record.streak_days or 0) + 1

    db.commit()
    db.refresh(record)

    return {
        "success": True,
        "updated_skill": {
            "id": record.id,
            "skill_name": record.skill_name,
            "status": record.status,
            "current_proficiency": record.current_proficiency,
            "notes": record.notes,
            "checklist": record.checklist,
            "streak_days": record.streak_days
        }
    }

@router.get("/quiz/{skill_name}")
def get_quiz_for_skill(skill_name: str):
    """Returns assessment questions for skill reassessment (without revealing correct answers)."""
    questions = get_skill_quiz(skill_name)
    sanitized = []
    for q in questions:
        sanitized.append({
            "question": q["question"],
            "options": q["options"]
        })
    return {
        "skill_name": skill_name,
        "questions": sanitized,
        "total_questions": len(sanitized),
        "passing_threshold_percentage": 75.0
    }

@router.post("/quiz/{skill_name}/submit")
def submit_skill_quiz(
    skill_name: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates candidate's quiz answers. If score >= 75%, upgrades verified proficiency
    in both UserSkillProgress and the latest SkillAnalysis breakdown.
    """
    answers = payload.get("answers", [])
    result = evaluate_quiz_submission(skill_name, answers)

    # If passed, upgrade proficiency in database
    if result["passed"]:
        prog = db.query(UserSkillProgress).filter(
            UserSkillProgress.user_id == current_user.id,
            UserSkillProgress.skill_name == skill_name
        ).first()

        new_prof = 4 # Upgraded to Proficient / Verified
        if not prog:
            prog = UserSkillProgress(
                user_id=current_user.id,
                skill_name=skill_name,
                category=categorize_skill(skill_name),
                target_proficiency=4,
                current_proficiency=new_prof,
                status="verified",
                reassessment_score=result["score_percentage"],
                reassessment_passed=True,
                reassessment_date=datetime.utcnow(),
                streak_days=1
            )
            db.add(prog)
        else:
            prog.current_proficiency = max(prog.current_proficiency, new_prof)
            prog.status = "verified"
            prog.reassessment_score = result["score_percentage"]
            prog.reassessment_passed = True
            prog.reassessment_date = datetime.utcnow()
            prog.streak_days = (prog.streak_days or 0) + 1

        # Also update the latest SkillAnalysis breakdown for live consistency
        latest_analysis = (
            db.query(SkillAnalysis)
            .filter(SkillAnalysis.user_id == current_user.id)
            .order_by(SkillAnalysis.created_at.desc())
            .first()
        )
        if latest_analysis and latest_analysis.skill_breakdown:
            updated_breakdown = []
            for item in latest_analysis.skill_breakdown:
                if normalize_skill_name(item["skill_name"]) == normalize_skill_name(skill_name):
                    item["estimated_proficiency"] = max(item.get("estimated_proficiency") or 0, new_prof)
                    item["verified"] = True
                    item["evidence_type"] = "ProofHire Reassessment Verified"
                    item["evidence_details"] = f"Verified with {result['score_percentage']}% score on ProofHire technical reassessment."
                    item["gap_level"] = "Strong"
                    item["status"] = "Strong Skill"
                updated_breakdown.append(item)
            latest_analysis.skill_breakdown = updated_breakdown

        db.commit()

    return result
