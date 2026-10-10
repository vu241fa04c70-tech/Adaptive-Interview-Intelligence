import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from database import get_db
from models import Candidate, JobDescription, InterviewSession, QuestionAnswer, EvaluationReport
from schemas import (
    CreateInterviewRequest,
    InterviewSessionResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    FinalReportResponse,
    QuestionAnswerSchema
)
from services.job_parser import parse_job_description
from services.competency_engine import get_role_competency_map
from services.adaptive_engine import generate_opening_question, evaluate_and_generate_next
from services.report_generator import generate_final_report

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

@router.post("/create", response_model=InterviewSessionResponse)
def create_interview(req: CreateInterviewRequest, db: Session = Depends(get_db)):
    # 1. Candidate record
    candidate = Candidate(
        name=req.candidate_name,
        email=req.candidate_email,
        raw_resume_text=req.raw_resume_text,
        parsed_skills=req.parsed_skills,
        parsed_projects=req.parsed_projects,
        parsed_experience=req.parsed_experience,
        parsed_education=req.parsed_education,
        parsed_technologies=req.parsed_technologies
    )
    db.add(candidate)
    db.flush()

    # 2. Job Description record
    parsed_jd = parse_job_description(req.job_title, "Target Company", req.job_description_text)
    job_desc = JobDescription(
        title=req.job_title,
        company=parsed_jd.get("company", "Target Company"),
        raw_text=req.job_description_text,
        required_skills=parsed_jd.get("required_skills", []),
        preferred_skills=parsed_jd.get("preferred_skills", []),
        experience_level=parsed_jd.get("experience_level", "Intermediate"),
        domain_focus=parsed_jd.get("domain_focus", req.job_title)
    )
    db.add(job_desc)
    db.flush()

    # 3. Competency Map initialization
    initial_comp_map = get_role_competency_map(req.job_title, parsed_jd.get("required_skills", []))

    # 4. Interview Session record
    session_id = str(uuid.uuid4())
    session = InterviewSession(
        id=session_id,
        candidate_id=candidate.id,
        job_id=job_desc.id,
        role=req.job_title,
        target_difficulty=req.target_difficulty,
        duration_minutes=req.duration_minutes,
        mode=req.mode,
        interview_type=req.interview_type,
        status="created",
        competency_map=initial_comp_map
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return get_session_response(session, db)


@router.get("/{session_id}", response_model=InterviewSessionResponse)
def get_interview(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return get_session_response(session, db)


@router.post("/{session_id}/start")
def start_interview(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if session.status != "created" and len(session.qa_pairs) > 0:
        # Already started
        first_qa = session.qa_pairs[0]
        return {
            "session_id": session.id,
            "status": session.status,
            "first_question": {
                "question_index": first_qa.question_index,
                "question_text": first_qa.question_text,
                "question_type": first_qa.question_type,
                "target_competency": first_qa.target_competency,
                "difficulty": first_qa.difficulty,
                "reason_for_next_question": first_qa.reason_for_next_question
            }
        }

    candidate = session.candidate
    job_desc = session.job_description
    parsed_resume = {
        "skills": candidate.parsed_skills,
        "projects": candidate.parsed_projects,
        "experience": candidate.parsed_experience,
        "education": candidate.parsed_education,
        "technologies": candidate.parsed_technologies
    }
    parsed_jd = {
        "title": job_desc.title,
        "company": job_desc.company,
        "required_skills": job_desc.required_skills
    }

    competencies = list(session.competency_map.keys())
    opening = generate_opening_question(
        candidate_name=candidate.name,
        role=session.role,
        parsed_resume=parsed_resume,
        job_description=parsed_jd,
        target_difficulty=session.target_difficulty,
        duration_minutes=session.duration_minutes,
        competencies=competencies
    )

    # Store Q1 in database
    qa = QuestionAnswer(
        session_id=session.id,
        question_index=1,
        question_text=opening.get("question_text"),
        question_type=opening.get("question_type", "opening"),
        target_competency=opening.get("target_competency", competencies[0]),
        difficulty=opening.get("difficulty", session.target_difficulty),
        reason_for_next_question=opening.get("reason_for_next_question")
    )
    session.status = "in_progress"
    session.start_time = datetime.utcnow()
    db.add(qa)
    db.commit()

    return {
        "session_id": session.id,
        "status": session.status,
        "first_question": {
            "question_index": 1,
            "question_text": qa.question_text,
            "question_type": qa.question_type,
            "target_competency": qa.target_competency,
            "difficulty": qa.difficulty,
            "reason_for_next_question": qa.reason_for_next_question
        }
    }


@router.post("/{session_id}/answer", response_model=SubmitAnswerResponse)
def submit_answer(session_id: str, req: SubmitAnswerRequest, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    qa_list = session.qa_pairs
    if not qa_list:
        raise HTTPException(status_code=400, detail="Interview not started. Call /start first.")

    current_qa = qa_list[-1]
    current_qa.candidate_answer = req.answer_text
    current_qa.answer_time_seconds = req.answer_time_seconds

    # Build Q&A history for context
    history_dict = []
    for qa in qa_list[:-1]:
        history_dict.append({
            "question_text": qa.question_text,
            "candidate_answer": qa.candidate_answer,
            "score": qa.score,
            "target_competency": qa.target_competency
        })

    candidate = session.candidate
    job_desc = session.job_description
    parsed_resume = {
        "skills": candidate.parsed_skills,
        "projects": candidate.parsed_projects,
        "experience": candidate.parsed_experience
    }
    parsed_jd = {
        "title": job_desc.title,
        "required_skills": job_desc.required_skills
    }

    current_q_dict = {
        "question_text": current_qa.question_text,
        "target_competency": current_qa.target_competency,
        "difficulty": current_qa.difficulty
    }

    # Evaluate answer & generate next adaptive question
    eval_res = evaluate_and_generate_next(
        session_id=session.id,
        role=session.role,
        history=history_dict,
        current_question=current_q_dict,
        candidate_answer=req.answer_text,
        answer_time_seconds=req.answer_time_seconds,
        competency_map=session.competency_map,
        target_difficulty=session.target_difficulty,
        duration_minutes=session.duration_minutes,
        parsed_resume=parsed_resume,
        job_description=parsed_jd
    )

    # Save current QA evaluation
    current_qa.answer_summary = eval_res.get("answer_summary")
    current_qa.score = float(eval_res.get("score", 2.0))
    current_qa.rubric_scores = eval_res.get("rubric_scores", {})
    current_qa.demonstrated_concepts = eval_res.get("demonstrated_concepts", [])
    current_qa.missing_concepts = eval_res.get("missing_concepts", [])
    current_qa.evidence = eval_res.get("evidence", [])
    current_qa.uncertainties = eval_res.get("uncertainties", [])

    # Update session competency map
    updated_map = eval_res.get("updated_competency_map", session.competency_map)
    session.competency_map = updated_map

    is_complete = bool(eval_res.get("is_interview_complete", False))
    next_index = len(qa_list) + 1 if not is_complete else None
    next_text = eval_res.get("next_question_text") if not is_complete else None

    if not is_complete and next_text:
        next_qa = QuestionAnswer(
            session_id=session.id,
            question_index=next_index,
            question_text=next_text,
            question_type=eval_res.get("next_question_type", "follow_up"),
            target_competency=eval_res.get("next_target_competency"),
            difficulty=eval_res.get("next_question_difficulty", session.target_difficulty),
            reason_for_next_question=eval_res.get("reason_for_next_question")
        )
        db.add(next_qa)

    if is_complete:
        session.status = "completed"
        session.end_time = datetime.utcnow()

    db.commit()

    return SubmitAnswerResponse(
        session_id=session.id,
        answered_question_index=current_qa.question_index,
        evaluated_score=current_qa.score,
        answer_summary=current_qa.answer_summary or "",
        demonstrated_concepts=current_qa.demonstrated_concepts,
        missing_concepts=current_qa.missing_concepts,
        evidence=current_qa.evidence,
        reason_for_next_question=eval_res.get("reason_for_next_question", ""),
        is_interview_complete=is_complete,
        next_question_index=next_index,
        next_question_text=next_text,
        next_question_type=eval_res.get("next_question_type"),
        next_question_difficulty=eval_res.get("next_question_difficulty"),
        next_target_competency=eval_res.get("next_target_competency"),
        updated_competency_map=updated_map
    )


@router.post("/{session_id}/end")
def end_interview(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    session.status = "completed"
    if not session.end_time:
        session.end_time = datetime.utcnow()

    # Generate or fetch report
    if not session.report:
        candidate = session.candidate
        job_desc = session.job_description
        
        qa_dicts = []
        for qa in session.qa_pairs:
            qa_dicts.append({
                "question_index": qa.question_index,
                "question_text": qa.question_text,
                "question_type": qa.question_type,
                "target_competency": qa.target_competency,
                "difficulty": qa.difficulty,
                "candidate_answer": qa.candidate_answer,
                "answer_summary": qa.answer_summary,
                "score": qa.score,
                "rubric_scores": qa.rubric_scores,
                "demonstrated_concepts": qa.demonstrated_concepts,
                "missing_concepts": qa.missing_concepts,
                "evidence": qa.evidence,
                "reason_for_next_question": qa.reason_for_next_question
            })

        parsed_resume = {
            "skills": candidate.parsed_skills,
            "projects": candidate.parsed_projects,
            "experience": candidate.parsed_experience
        }
        parsed_jd = {
            "title": job_desc.title,
            "required_skills": job_desc.required_skills
        }

        report_data = generate_final_report(
            session_id=session.id,
            candidate_name=candidate.name,
            role=session.role,
            duration_minutes=session.duration_minutes,
            competency_map=session.competency_map,
            qa_list=qa_dicts,
            parsed_resume=parsed_resume,
            job_description=parsed_jd
        )

        db_report = EvaluationReport(
            session_id=session.id,
            overall_score=report_data["overall_score"],
            summary=report_data["summary"],
            competency_breakdown=report_data["competency_breakdown"],
            strengths=report_data["strengths"],
            areas_for_improvement=report_data["areas_for_improvement"],
            skill_gap_analysis={"matrix": report_data["skill_gap_matrix"]},
            suggested_practice_questions=report_data["suggested_practice_questions"],
            learning_roadmap=report_data["learning_roadmap"],
            recruiter_next_steps=report_data["recruiter_next_steps"],
            confidence_and_limitations=report_data["confidence_and_limitations"]
        )
        db.add(db_report)

    db.commit()
    return {"status": "completed", "session_id": session_id}


@router.get("/{session_id}/report", response_model=FinalReportResponse)
def get_report(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if not session.report:
        # Trigger report generation
        end_interview(session_id, db)
        db.refresh(session)

    report = session.report
    candidate = session.candidate

    qa_schemas = []
    for qa in session.qa_pairs:
        qa_schemas.append(QuestionAnswerSchema(
            id=qa.id,
            question_index=qa.question_index,
            question_text=qa.question_text,
            question_type=qa.question_type,
            target_competency=qa.target_competency,
            difficulty=qa.difficulty,
            candidate_answer=qa.candidate_answer,
            answer_time_seconds=qa.answer_time_seconds or 0.0,
            answer_summary=qa.answer_summary,
            demonstrated_concepts=qa.demonstrated_concepts or [],
            missing_concepts=qa.missing_concepts or [],
            evidence=qa.evidence or [],
            uncertainties=qa.uncertainties or [],
            score=qa.score or 0.0,
            rubric_scores=qa.rubric_scores or {},
            reason_for_next_question=qa.reason_for_next_question,
            confidence=qa.confidence or 0.9,
            created_at=qa.created_at
        ))

    skill_matrix = report.skill_gap_analysis.get("matrix", []) if report.skill_gap_analysis else []

    return FinalReportResponse(
        session_id=session.id,
        candidate_name=candidate.name,
        role=session.role,
        date=report.created_at.strftime("%Y-%m-%d %H:%M UTC"),
        duration_minutes=session.duration_minutes,
        total_questions=len(qa_schemas),
        overall_score=report.overall_score,
        summary=report.summary,
        competency_breakdown=session.competency_map,
        strengths=report.strengths or [],
        areas_for_improvement=report.areas_for_improvement or [],
        skill_gap_matrix=skill_matrix,
        qa_details=qa_schemas,
        suggested_practice_questions=report.suggested_practice_questions or [],
        learning_roadmap=report.learning_roadmap or [],
        recruiter_next_steps=report.recruiter_next_steps or [],
        confidence_and_limitations=report.confidence_and_limitations or ""
    )


@router.get("", response_model=List[InterviewSessionResponse])
def list_interviews(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()
    res = []
    for s in sessions:
        res.append(get_session_response(s, db))
    return res


def get_session_response(session: InterviewSession, db: Session) -> InterviewSessionResponse:
    candidate = session.candidate
    job = session.job_description

    qa_schemas = []
    for qa in session.qa_pairs:
        qa_schemas.append(QuestionAnswerSchema(
            id=qa.id,
            question_index=qa.question_index,
            question_text=qa.question_text,
            question_type=qa.question_type,
            target_competency=qa.target_competency,
            difficulty=qa.difficulty,
            candidate_answer=qa.candidate_answer,
            answer_time_seconds=qa.answer_time_seconds or 0.0,
            answer_summary=qa.answer_summary,
            demonstrated_concepts=qa.demonstrated_concepts or [],
            missing_concepts=qa.missing_concepts or [],
            evidence=qa.evidence or [],
            uncertainties=qa.uncertainties or [],
            score=qa.score or 0.0,
            rubric_scores=qa.rubric_scores or {},
            reason_for_next_question=qa.reason_for_next_question,
            confidence=qa.confidence or 0.9,
            created_at=qa.created_at
        ))

    return InterviewSessionResponse(
        session_id=session.id,
        candidate_name=candidate.name if candidate else "Candidate",
        role=session.role,
        job_title=job.title if job else session.role,
        target_difficulty=session.target_difficulty,
        duration_minutes=session.duration_minutes,
        interview_type=session.interview_type,
        mode=session.mode,
        status=session.status,
        competency_map=session.competency_map or {},
        qa_history=qa_schemas,
        created_at=session.created_at
    )
