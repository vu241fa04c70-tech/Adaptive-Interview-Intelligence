# ProofHire AI — Database Schema & Migrations

> **Supported Engines:** SQLite (`proofhire.db`) for zero-setup local dev / PostgreSQL / Supabase for production deployment.

---

## 📊 Database Schema Overview

```mermaid
erDiagram
    CANDIDATE ||--o{ INTERVIEW_SESSION : "has interviews"
    JOB_DESCRIPTION ||--o{ INTERVIEW_SESSION : "defines requirements"
    INTERVIEW_SESSION ||--o{ QUESTION_ANSWER : "contains Q&A history"
    INTERVIEW_SESSION ||--o| EVALUATION_REPORT : "generates final report"

    CANDIDATE {
        int id PK
        string name
        string email
        string resume_filename
        text raw_resume_text
        json parsed_skills
        json parsed_projects
        json parsed_experience
        datetime created_at
    }

    JOB_DESCRIPTION {
        int id PK
        string title
        string company
        text raw_text
        json required_skills
        json preferred_skills
        datetime created_at
    }

    INTERVIEW_SESSION {
        string id PK "UUID"
        int candidate_id FK
        int job_id FK
        string role
        string target_difficulty
        int duration_minutes
        string mode
        string interview_type
        string status
        json competency_map
        json integrity_events "Module 03 timeline"
        datetime start_time
        datetime end_time
    }

    QUESTION_ANSWER {
        int id PK
        string session_id FK
        int question_index
        text question_text
        string question_type
        string target_competency
        string difficulty
        text candidate_answer
        float answer_time_seconds
        float score "0-4 scale"
        json rubric_scores
        json evidence "verbatim quotes"
        json adaptation_pipeline "Module 01 step-by-step"
    }

    EVALUATION_REPORT {
        int id PK
        string session_id FK
        float overall_score "0-100%"
        text summary
        json competency_breakdown
        json skill_gap_analysis "Module 04 4-state matrix"
        json integrity_risk_profile "Module 03 risk score & timeline"
        json decision_intelligence "Module 05 weighted rubric & recruiter plan"
    }
```

---

## 🛠 Setup & Table Creation

To initialize or reset tables locally using SQLAlchemy `Base.metadata.create_all`:
```bash
# Set database connection string in .env (default: sqlite:///./proofhire.db)
DATABASE_URL=sqlite:///./proofhire.db
```
Tables are automatically created on backend startup via `backend/app/main.py`.
