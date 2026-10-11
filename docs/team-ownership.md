# ProofHire AI — Team Ownership Boundaries & Workflow Guidelines

> **Team Size:** 5 Members  
> **Repository Model:** Single Shared Monorepo  
> **Workflow:** Feature Branching + Pull Request Code Review  

---

## 👥 Module Ownership Matrix

| Member | Role | Owned Directory / Scope | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Frontend Developer** | `frontend/` | UI/UX pages (Landing, Setup, InterviewRoom, Report, Recruiter), Web Speech STT/TTS integration, Recharts visualizer, API integration. |
| **Member 2** | **AI Interview Engine Developer** | `backend/app/services/ai/` | Gemini 2.5 Flash API client, adaptive question generator, follow-up prompt engineering, context retention. |
| **Member 3** | **Resume & Job Intelligence Developer** | `backend/app/services/resume/` | Multi-format PDF/DOCX resume extraction, job description parser, skill/competency extraction heuristics & AI schemas. |
| **Member 4** | **Evaluation & Reporting Developer** | `backend/app/services/evaluation/` | 0-4 Rubric answer evaluation, verbatim quote evidence extraction, Module 03 Integrity Intelligence, Module 05 Candidate Decision Intelligence. |
| **Member 5** | **Team Lead & Integration Specialist** | Shared Architecture, `backend/app/api/`, `backend/app/models/`, `backend/app/schemas/`, `backend/app/db/` | System architecture, Pydantic schemas, SQLAlchemy database models, FastAPI router orchestration, CI/CD, Git PR reviews. |

---

## 🌿 Git Branching Strategy

All team members work in the **single shared monorepo** on dedicated feature branches:

- **Main Branch**: `main` (Contains tested, production-ready integrated code. Direct pushes are disabled).
- **Feature Branches**:
  - `feature/frontend` (Member 1)
  - `feature/ai-engine` (Member 2)
  - `feature/resume-intelligence` (Member 3)
  - `feature/evaluation-reporting` (Member 4)
  - `feature/integration-orchestration` (Member 5)

---

## 🔄 Pull Request & Code Integration Workflow

1. **Branch Creation**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/<your-assigned-module>
   ```
2. **Local Incremental Development**:
   - Work strictly within your owned directory scope.
   - Run local tests:
     - Backend: `pytest backend/tests`
     - Frontend: `cd frontend && npm run build`
3. **Commit Guidelines**:
   - Write clear, descriptive commit messages:
     - `feat(ai): add 5-step explainable adaptation pipeline reasoning`
     - `feat(integrity): log real-time tab switch and paste events`
     - `fix(schemas): update skill gap matrix 4-state enum`
4. **Pull Request Submission**:
   - Push branch to GitHub: `git push origin feature/<your-assigned-module>`
   - Open Pull Request targeting `main`.
   - Member 5 (Team Lead) reviews contract alignment and runs test suite before merging.
