from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import InterviewSession, User
from schemas import RecruiterAnalyticsResponse, RecruiterCandidateOverview
from routes.auth import get_current_admin_user

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])

@router.get("/analytics", response_model=RecruiterAnalyticsResponse)
def get_recruiter_analytics(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
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

        integrity_level = "low"
        decision_rec = "PROCEED_WITH_DEEP_DIVE"
        if report:
            if report.integrity_risk_profile and isinstance(report.integrity_risk_profile, dict):
                integrity_level = report.integrity_risk_profile.get("risk_level", "low")
            if report.decision_intelligence and isinstance(report.decision_intelligence, dict):
                decision_rec = report.decision_intelligence.get("overall_fit_recommendation", "PROCEED_WITH_DEEP_DIVE")

        candidates_list.append(RecruiterCandidateOverview(
            session_id=s.id,
            candidate_name=s.candidate.name if s.candidate else "Candidate",
            role=s.role,
            target_difficulty=s.target_difficulty,
            overall_score=overall_score,
            completed_at=s.created_at.strftime("%Y-%m-%d"),
            status=s.status,
            top_strengths=top_strengths,
            key_gaps=key_gaps,
            integrity_risk_level=integrity_level,
            decision_recommendation=decision_rec
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
