from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import InterviewSession
from schemas import RecruiterAnalyticsResponse, RecruiterCandidateOverview

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])

@router.get("/analytics", response_model=RecruiterAnalyticsResponse)
def get_recruiter_analytics(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).all()
    
    candidates_list = []
    scores = []

    role_scores = {}

    for s in sessions:
        report = s.report
        overall_score = report.overall_score if report else 0.0
        if overall_score > 0:
            scores.append(overall_score)
            role_scores.setdefault(s.role, []).append(overall_score)

        top_strengths = report.strengths[:2] if report and report.strengths else ["General Technical Skills"]
        key_gaps = report.areas_for_improvement[:2] if report and report.areas_for_improvement else ["System Architecture"]

        candidates_list.append(RecruiterCandidateOverview(
            session_id=s.id,
            candidate_name=s.candidate.name if s.candidate else "Candidate",
            role=s.role,
            target_difficulty=s.target_difficulty,
            overall_score=overall_score,
            completed_at=s.created_at.strftime("%Y-%m-%d"),
            status=s.status,
            top_strengths=top_strengths,
            key_gaps=key_gaps
        ))

    # Sort candidates by score descending
    candidates_list.sort(key=lambda c: c.overall_score, reverse=True)

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    role_benchmarks = {}
    for r_name, r_sc in role_scores.items():
        role_benchmarks[r_name] = round(sum(r_sc) / len(r_sc), 1)

    return RecruiterAnalyticsResponse(
        total_interviews=len(sessions),
        avg_score=avg_score,
        candidates=candidates_list,
        role_benchmarks=role_benchmarks
    )
