import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from services.competency_engine import get_role_competency_map, update_competency_status
from services.adaptive_engine import generate_opening_question, evaluate_and_generate_next

client = TestClient(app)

def test_system_status_endpoint():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gemini_api_key_configured" in data

def test_competency_map_initialization():
    comp_map = get_role_competency_map("Python Developer Intern", ["FastAPI", "Docker"])
    assert "Python Fundamentals & Syntax" in comp_map
    assert "APIs & Backend Development" in comp_map
    assert comp_map["Python Fundamentals & Syntax"]["status"] == "unassessed"

def test_competency_update_logic():
    comp_map = get_role_competency_map("Python Developer")
    updated = update_competency_status(comp_map, "Python Fundamentals & Syntax", 3.5, 1)
    assert updated["Python Fundamentals & Syntax"]["score"] == 3.5
    assert updated["Python Fundamentals & Syntax"]["status"] == "demonstrated"

def test_opening_question_generation():
    parsed_resume = {"skills": ["Python", "Django"], "projects": [{"title": "Web Scraper"}]}
    job_desc = {"title": "Python Developer", "required_skills": ["Python"]}
    comp_list = ["Python Fundamentals", "Database Design"]
    
    opening = generate_opening_question(
        candidate_name="Test Candidate",
        role="Python Developer",
        parsed_resume=parsed_resume,
        job_description=job_desc,
        target_difficulty="intermediate",
        duration_minutes=20,
        competencies=comp_list
    )
    
    assert "question_text" in opening
    assert opening["question_type"] == "opening"
    assert "Web Scraper" in opening["question_text"] or "Python" in opening["question_text"]

def test_adaptive_followup_and_evaluation():
    comp_map = get_role_competency_map("Python Developer")
    current_q = {"question_text": "Describe how you handle exceptions in Python", "target_competency": "Exception Handling & Resilience"}
    
    # 1. Test strong answer
    strong_eval = evaluate_and_generate_next(
        session_id="test-123",
        role="Python Developer",
        history=[],
        current_question=current_q,
        candidate_answer="I use custom exception classes inheriting from Exception, wrapped in try-except blocks with explicit logging using python logging module and fallback values because trade-offs matter.",
        answer_time_seconds=25.0,
        competency_map=comp_map,
        target_difficulty="intermediate",
        duration_minutes=20,
        parsed_resume={},
        job_description={}
    )
    
    assert strong_eval["score"] >= 3.0
    assert "reason_for_next_question" in strong_eval
    assert strong_eval["reason_for_next_question"] != ""
    assert "next_question_text" in strong_eval

    # 2. Test IDK answer
    idk_eval = evaluate_and_generate_next(
        session_id="test-123",
        role="Python Developer",
        history=[],
        current_question=current_q,
        candidate_answer="I don't know.",
        answer_time_seconds=5.0,
        competency_map=comp_map,
        target_difficulty="intermediate",
        duration_minutes=20,
        parsed_resume={},
        job_description={}
    )
    assert idk_eval["score"] < 1.5
    assert "honesty" in str(idk_eval["demonstrated_concepts"]).lower() or "limitation" in str(idk_eval["evidence"]).lower()

def test_end_to_end_interview_flow():
    # 1. Create interview
    create_payload = {
        "candidate_name": "Unit Test Candidate",
        "candidate_email": "unittest@example.com",
        "parsed_skills": ["Python", "FastAPI"],
        "parsed_projects": [{"title": "API Gateway"}],
        "job_title": "Python Developer Intern",
        "job_description_text": "We need a Python developer who knows FastAPI and SQL.",
        "duration_minutes": 10,
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
    first_q = start_res.json()["first_question"]
    assert "question_text" in first_q
    
    # 3. Answer question
    ans_payload = {
        "answer_text": "In my API Gateway project, I used FastAPI with asynchronous endpoint functions and Pydantic schemas to validate incoming payloads efficiently.",
        "answer_time_seconds": 20.0
    }
    ans_res = client.post(f"/api/interviews/{session_id}/answer", json=ans_payload)
    assert ans_res.status_code == 200
    ans_data = ans_res.json()
    assert ans_data["evaluated_score"] > 2.0
    assert ans_data["reason_for_next_question"] != ""
    
    # 4. Fetch Report
    report_res = client.get(f"/api/interviews/{session_id}/report")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["candidate_name"] == "Unit Test Candidate"
    assert len(report_data["skill_gap_matrix"]) > 0
