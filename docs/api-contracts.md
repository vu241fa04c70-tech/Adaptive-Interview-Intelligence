# ProofHire AI — API Contracts Specification

> **Version:** 1.0.0  
> **Base URL:** `/api`  
> **Format:** JSON  

---

## Overview

This document specifies the exact API contracts for **ProofHire AI — Adaptive Interview Intelligence Platform**. It serves as the single source of truth for backend developers implementing endpoints and frontend developers consuming them.

---

## 1. Health Check Endpoint

### `GET /api/health` & `GET /api/system/status`
Returns system health, Gemini API configuration status, and active engine mode.

- **Module Ownership**: Member 5 (Integration & Team Lead)
- **Request Parameters**: None
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "gemini_api_key_configured": true,
  "mode": "gemini_2.5_flash",
  "model": "gemini-2.5-flash"
}
```

---

## 2. Resume & Job Parsing Endpoints

### `POST /api/resume/parse`
Parses candidate resume files (PDF, DOCX) or raw text into structured skills, experience, and projects.

- **Module Ownership**: Member 3 (Resume & Job Intelligence)
- **Content-Type**: `multipart/form-data` or `application/json`
- **Request Payload**:
```json
{
  "raw_text": "Experienced Python Developer with FastAPI and PostgreSQL background..."
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "candidate_id": 1,
  "raw_text": "...",
  "parsed": {
    "name": "Alex Chen",
    "email": "alex.chen@example.com",
    "skills": ["Python", "FastAPI", "SQL", "Docker"],
    "projects": [
      {
        "title": "API Gateway Service",
        "description": "Built high-throughput API gateway",
        "technologies": ["Python", "FastAPI", "Redis"]
      }
    ],
    "experience": [],
    "education": [],
    "technologies": ["Python", "FastAPI", "Redis", "Docker"],
    "summary": "Technical candidate with skills in Python, FastAPI, SQL."
  }
}
```

---

## 3. Interview Session Orchestration Endpoints

### `POST /api/interviews/create`
Initializes a persistent candidate profile, parses target job description, sets up competency map, and creates an interview session.

- **Module Ownership**: Member 5 (Team Lead / Session Orchestration)
- **Request Payload**:
```json
{
  "candidate_name": "Alex Chen",
  "candidate_email": "alex.chen@example.com",
  "parsed_skills": ["Python", "FastAPI"],
  "parsed_projects": [{"title": "API Gateway"}],
  "job_title": "Python Developer",
  "job_description_text": "We need a Python developer who understands FastAPI, SQL, and error resilience.",
  "duration_minutes": 20,
  "target_difficulty": "intermediate",
  "interview_type": "mixed",
  "mode": "text"
}
```
- **Response `200 OK`**: `InterviewSessionResponse`

### `POST /api/interviews/{session_id}/start`
Starts the session timer and generates Opening Question 1 grounded in resume claims and target role context.

- **Module Ownership**: Member 2 (AI Engine) & Member 5 (Integration)
- **Response `200 OK`**:
```json
{
  "session_id": "b767f269-e07e-43e5-a36f-fb4901821cf9",
  "status": "in_progress",
  "first_question": {
    "question_index": 1,
    "question_text": "Welcome Alex! Could you walk me through your API Gateway project...",
    "question_type": "opening",
    "target_competency": "Project Ownership & Architecture",
    "difficulty": "intermediate",
    "reason_for_next_question": "Probing candidate resume project to establish baseline engineering ownership.",
    "adaptation_pipeline": {
      "question_area": "Project Ownership & Architecture",
      "competency_coverage": "0 of 12 competencies evaluated",
      "question_relevance": "Probing claimed project for role alignment",
      "difficulty_selection": "Baseline level set to 'intermediate'",
      "next_question": "...",
      "reason_for_next_question": "..."
    }
  }
}
```

### `POST /api/interviews/{session_id}/answer`
Evaluates candidate answer against 0-4 rubric, extracts verbatim quote evidence, updates cumulative competency profile, and generates next adaptive question.

- **Module Ownership**: Member 2 (AI Engine) & Member 4 (Evaluation)
- **Request Payload**:
```json
{
  "answer_text": "In my API Gateway project, I used FastAPI with Pydantic schemas and try-except error handling...",
  "answer_time_seconds": 22.5
}
```
- **Response `200 OK`**:
```json
{
  "session_id": "b767f269-e07e-43e5-a36f-fb4901821cf9",
  "answered_question_index": 1,
  "evaluated_score": 3.5,
  "answer_summary": "Candidate provided detailed response with concrete implementation details.",
  "demonstrated_concepts": ["FastAPI", "Pydantic", "Error Handling"],
  "missing_concepts": ["Load balancing under extreme concurrency"],
  "evidence": [
    {
      "point": "Elaborated with relevant technical concepts",
      "quote": "In my API Gateway project, I used FastAPI with Pydantic schemas...",
      "status": "strong"
    }
  ],
  "reason_for_next_question": "Previous answer on target competency was strong. Escalating difficulty...",
  "adaptation_pipeline": {
    "question_area": "Python Fundamentals & Syntax",
    "competency_coverage": "1 of 12 competencies evaluated",
    "question_relevance": "Targeting Python Fundamentals in context of Python Developer role",
    "difficulty_selection": "Calibrated to 'Advanced' level based on score 3.5/4.0",
    "next_question": "...",
    "reason_for_next_question": "..."
  },
  "is_interview_complete": false,
  "next_question_index": 2,
  "next_question_text": "Great answer! Now stepping up to...",
  "next_question_type": "technical",
  "next_question_difficulty": "advanced",
  "next_target_competency": "Python Fundamentals & Syntax",
  "updated_competency_map": {}
}
```

---

## 4. Module 03 Integrity Events Endpoint

### `POST /api/interviews/{session_id}/integrity-event`
Logs real-time workspace observation events (tab switches, text pastes, speech pauses, typing speed anomalies).

- **Module Ownership**: Member 4 (Evaluation & Integrity)
- **Request Payload**:
```json
{
  "event_type": "TAB_SWITCH",
  "details": "Candidate switched browser window for 4 seconds",
  "confidence": 0.95
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "event_type": "TAB_SWITCH",
  "total_events": 1,
  "message": "Logged Tab Switch / Window Blur (medium severity)"
}
```

---

## 5. Candidate Intelligence Report Endpoint

### `GET /api/interviews/{session_id}/report`
Retrieves comprehensive evidence-backed final evaluation report synthesizing Modules 01-05.

- **Module Ownership**: Member 4 (Evaluation) & Member 5 (Integration)
- **Response `200 OK`**: `FinalReportResponse`
```json
{
  "session_id": "...",
  "candidate_name": "Alex Chen",
  "role": "Python Developer",
  "date": "2026-10-10 22:00 UTC",
  "duration_minutes": 20,
  "total_questions": 5,
  "overall_score": 82.5,
  "summary": "Executive summary paragraph...",
  "competency_breakdown": {},
  "strengths": ["Strong proficiency in FastAPI & Exception Handling"],
  "areas_for_improvement": ["Deepen architectural system design under scale"],
  "skill_gap_matrix": [
    {
      "competency": "FastAPI",
      "claimed_in_resume": true,
      "required_by_job": true,
      "demonstrated_score": 3.5,
      "status": "demonstrated",
      "evidence_summary": "Demonstrated with strong evidence score (3.5/4.0)."
    }
  ],
  "qa_details": [],
  "integrity_risk_profile": {
    "risk_level": "low",
    "risk_score": 10.0,
    "summary": "Low Integrity Risk Signal.",
    "events_timeline": [],
    "requires_human_review": false,
    "explainable_risk_profile": "FACTS: Session completed cleanly. RECOMMENDATION: No review required."
  },
  "decision_intelligence": {
    "overall_fit_recommendation": "STRONG_RECOMMENDATION",
    "fit_confidence_score": 92.5,
    "weighted_rubric_scores": {
      "technical_correctness_40pct": 85.0,
      "problem_solving_25pct": 80.0,
      "depth_of_understanding_20pct": 80.0,
      "clarity_relevance_15pct": 90.0
    },
    "role_alignment_summary": "Candidate aligns strongly with target role requirements...",
    "unresolved_uncertainties": [],
    "key_evidence_quotes": [],
    "recruiter_action_plan": []
  },
  "suggested_practice_questions": [],
  "learning_roadmap": [],
  "recruiter_next_steps": [],
  "confidence_and_limitations": "..."
}
```

---

## 6. Recruiter Dashboard Analytics Endpoint

### `GET /api/recruiter/analytics`
Retrieves pool comparative ranking, role benchmarks, integrity flags, and candidate decision recommendations.

- **Module Ownership**: Member 1 (Frontend) & Member 5 (Team Lead)
- **Response `200 OK`**: `RecruiterAnalyticsResponse`
```json
{
  "total_interviews": 12,
  "avg_score": 74.2,
  "candidates": [
    {
      "session_id": "...",
      "candidate_name": "Alex Chen",
      "role": "Python Developer",
      "target_difficulty": "intermediate",
      "overall_score": 82.5,
      "completed_at": "2026-10-10",
      "status": "completed",
      "top_strengths": ["FastAPI", "Database Design"],
      "key_gaps": ["System Scaling"],
      "integrity_risk_level": "low",
      "decision_recommendation": "STRONG_RECOMMENDATION"
    }
  ],
  "role_benchmarks": {
    "Python Developer": 78.5,
    "Frontend Developer": 72.0
  }
}
```
