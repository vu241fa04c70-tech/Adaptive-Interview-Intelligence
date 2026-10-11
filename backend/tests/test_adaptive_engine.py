import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from services.competency_engine import get_role_competency_map, update_competency_status
from services.adaptive_engine import generate_opening_question, evaluate_and_generate_next
from services.integrity_engine import analyze_integrity_events, classify_event
from services.report_generator import generate_final_report

client = TestClient(app)

def test_system_status_endpoint():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gemini_api_key_configured" in data

def test_module_01_question_adaptation_and_pipeline():
    parsed_resume = {"skills": ["Python", "FastAPI"], "projects": [{"title": "API Gateway"}]}
    job_desc = {"title": "Python Developer", "required_skills": ["Python", "SQL"]}
    comp_list = ["Python Fundamentals & Syntax", "APIs & Backend Development"]
    
    opening = generate_opening_question(
        candidate_name="Alex Chen",
        role="Python Developer",
        parsed_resume=parsed_resume,
        job_description=job_desc,
        target_difficulty="intermediate",
        duration_minutes=20,
        competencies=comp_list
    )
    
    assert "question_text" in opening
    assert opening["question_type"] == "opening"
    assert "adaptation_pipeline" in opening
    pipeline = opening["adaptation_pipeline"]
    assert "question_area" in pipeline
    assert "competency_coverage" in pipeline
    assert "question_relevance" in pipeline
    assert "difficulty_selection" in pipeline

def test_module_02_realtime_rubric_evaluation():
    comp_map = get_role_competency_map("Python Developer")
    current_q = {
        "question_text": "Describe how you handle exceptions and validation in FastAPI",
        "target_competency": "Exception Handling & Resilience"
    }
    
    strong_eval = evaluate_and_generate_next(
        session_id="test-123",
        role="Python Developer",
        history=[],
        current_question=current_q,
        candidate_answer="I define custom exception classes with Pydantic validation models wrapped in try-except blocks with explicit logging to handle failure scenarios.",
        answer_time_seconds=25.0,
        competency_map=comp_map,
        target_difficulty="intermediate",
        duration_minutes=20,
        parsed_resume={},
        job_description={}
    )
    
    assert strong_eval["score"] >= 3.0
    assert "rubric_scores" in strong_eval
    assert "technical_correctness" in strong_eval["rubric_scores"]
    assert len(strong_eval["evidence"]) > 0
    assert "adaptation_pipeline" in strong_eval

def test_module_03_interview_integrity_intelligence():
    # 1. Test event classification
    classified = classify_event("TAB_SWITCH", "Candidate blurred window", 0.95)
    assert classified["event_type"] == "TAB_SWITCH"
    assert classified["severity"] == "medium"

    # 2. Test timeline aggregation and risk profile
    events = [
        {"event_type": "TAB_SWITCH", "timestamp": "2026-10-10T16:00:00Z", "details": "Tab switch 1"},
        {"event_type": "TAB_SWITCH", "timestamp": "2026-10-10T16:01:00Z", "details": "Tab switch 2"},
        {"event_type": "PASTE_DETECTED", "timestamp": "2026-10-10T16:02:00Z", "details": "Pasted 200 chars"}
    ]
    risk_profile = analyze_integrity_events(events)
    assert risk_profile["risk_score"] > 25.0
    assert risk_profile["requires_human_review"] is True
    assert "events_timeline" in risk_profile
    assert len(risk_profile["events_timeline"]) == 3

def test_module_04_skill_gap_intelligence_4state():
    comp_map = get_role_competency_map("Python Developer")
    comp_map["Python Fundamentals & Syntax"]["status"] = "demonstrated"
    comp_map["Python Fundamentals & Syntax"]["score"] = 3.5
    comp_map["Exception Handling & Resilience"]["status"] = "not_demonstrated"
    comp_map["Exception Handling & Resilience"]["score"] = 1.0

    qa_list = [
        {
            "question_index": 1,
            "target_competency": "Python Fundamentals & Syntax",
            "score": 3.5,
            "rubric_scores": {"technical_correctness": 3.5, "problem_solving": 3.5, "depth_of_understanding": 3.5, "clarity_of_explanation": 3.5},
            "evidence": [{"point": "Mastery", "quote": "I use list comprehensions and generators", "status": "strong"}]
        }
    ]

    report = generate_final_report(
        session_id="test-session-gap",
        candidate_name="Maya Lin",
        role="Python Developer",
        duration_minutes=20,
        competency_map=comp_map,
        qa_list=qa_list,
        parsed_resume={"skills": ["Python", "FastAPI", "Docker"]},
        job_description={"required_skills": ["Python", "SQL", "Kubernetes"]},
        integrity_events=[]
    )

    matrix = report["skill_gap_matrix"]
    assert len(matrix) > 0
    statuses = set(item["status"] for item in matrix)
    assert "demonstrated" in statuses

def test_module_05_candidate_decision_intelligence_and_full_flow():
    # 1. Create interview session
    create_payload = {
        "candidate_name": "Decision Intelligence Candidate",
        "candidate_email": "decision@example.com",
        "parsed_skills": ["Python", "FastAPI"],
        "parsed_projects": [{"title": "Microservice Architecture"}],
        "job_title": "Python Developer",
        "job_description_text": "We need a Python developer proficient in FastAPI, SQL, and microservices.",
        "duration_minutes": 20,
        "target_difficulty": "intermediate",
        "interview_type": "mixed",
        "mode": "text"
    }
    
    res = client.post("/api/interviews/create", json=create_payload)
    assert res.status_code == 200
    session_id = res.json()["session_id"]
    
    # 2. Start interview
    start_res = client.post(f"/api/interviews/{session_id}/start")
    assert start_res.status_code == 200
    
    # 3. Log Module 03 Integrity Event
    evt_res = client.post(f"/api/interviews/{session_id}/integrity-event", json={
        "event_type": "TAB_SWITCH",
        "details": "Candidate switched tabs for 5 seconds",
        "confidence": 0.9
    })
    assert evt_res.status_code == 200
    assert evt_res.json()["total_events"] == 1
    
    # 4. Answer question
    ans_res = client.post(f"/api/interviews/{session_id}/answer", json={
        "answer_text": "I architected a microservice backend using FastAPI async endpoints, Pydantic data validation schemas, and PostgreSQL with SQLAlchemy ORM.",
        "answer_time_seconds": 25.0
    })
    assert ans_res.status_code == 200
    
    # 5. Fetch Report and verify Module 05 Candidate Decision Intelligence
    report_res = client.get(f"/api/interviews/{session_id}/report")
    assert report_res.status_code == 200
    report_data = report_res.json()
    
    assert "decision_intelligence" in report_data
    decision = report_data["decision_intelligence"]
    assert "overall_fit_recommendation" in decision
    assert "weighted_rubric_scores" in decision
    assert "role_alignment_summary" in decision

    # 6. Recruiter analytics check
    rec_res = client.get("/api/recruiter/analytics")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert rec_data["total_interviews"] >= 1
