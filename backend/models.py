from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True) # Authoritative UUID generated on backend
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True) # Nullable for OAuth users
    role = Column(String(50), default="candidate") # "candidate" or "admin"
    auth_provider = Column(String(50), default="email") # "email", "google"
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    avatar_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Persistent relationships
    interviews = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="user", cascade="all, delete-orphan")
    skill_analyses = relationship("SkillAnalysis", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("LearningRoadmap", back_populates="user", cascade="all, delete-orphan")
    skill_progress = relationship("UserSkillProgress", back_populates="user", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    resume_filename = Column(String(255), nullable=True)
    raw_resume_text = Column(Text, nullable=True)
    parsed_skills = Column(JSON, default=list)        # list of string skills
    parsed_projects = Column(JSON, default=list)      # list of project dicts
    parsed_experience = Column(JSON, default=list)    # list of experience dicts
    parsed_education = Column(JSON, default=list)     # list of education dicts
    parsed_technologies = Column(JSON, default=list) # list of tech stacks
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="candidates")
    interviews = relationship("InterviewSession", back_populates="candidate", cascade="all, delete-orphan")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), default="Target Company")
    raw_text = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    experience_level = Column(String(100), default="Intermediate")
    domain_focus = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interviews = relationship("InterviewSession", back_populates="job_description", cascade="all, delete-orphan")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(64), primary_key=True, index=True) # UUID string
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    
    role = Column(String(255), nullable=False) # e.g. "Python Developer Intern"
    target_difficulty = Column(String(50), default="intermediate") # beginner, intermediate, advanced
    duration_minutes = Column(Integer, default=20) # 10, 20, 30
    mode = Column(String(50), default="text") # text, voice
    interview_type = Column(String(50), default="mixed") # technical, behavioral, project_based, mixed
    
    status = Column(String(50), default="created") # created, in_progress, completed
    competency_map = Column(JSON, default=dict) # dynamic state of competencies
    integrity_events = Column(JSON, default=list) # Module 03 integrity events timeline
    
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="interviews")
    candidate = relationship("Candidate", back_populates="interviews")
    job_description = relationship("JobDescription", back_populates="interviews")
    qa_pairs = relationship("QuestionAnswer", back_populates="session", cascade="all, delete-orphan", order_by="QuestionAnswer.question_index")
    report = relationship("EvaluationReport", back_populates="session", uselist=False, cascade="all, delete-orphan")


class QuestionAnswer(Base):
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="technical") # opening, resume, technical, follow_up, behavioral, closing
    target_competency = Column(String(100), nullable=True)
    difficulty = Column(String(50), default="intermediate")
    
    candidate_answer = Column(Text, nullable=True)
    answer_time_seconds = Column(Float, default=0.0)
    
    # AI Evaluation & Reasoning outputs
    answer_summary = Column(Text, nullable=True)
    demonstrated_concepts = Column(JSON, default=list)
    missing_concepts = Column(JSON, default=list)
    evidence = Column(JSON, default=list) # [{point, quote, status}]
    uncertainties = Column(JSON, default=list)
    
    score = Column(Float, default=0.0) # 0-4 overall question score
    rubric_scores = Column(JSON, default=dict) # {technical_correctness, depth, problem_solving, clarity, relevance}
    
    reason_for_next_question = Column(Text, nullable=True)
    adaptation_pipeline = Column(JSON, default=dict) # Module 01: {question_area, competency_coverage, question_relevance, difficulty_selection, next_question, reason_for_next_question}
    confidence = Column(Float, default=0.9)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="qa_pairs")


class EvaluationReport(Base):
    __tablename__ = "evaluation_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.id"), nullable=False, unique=True)
    
    overall_score = Column(Float, default=0.0) # 0 - 100 percentage
    summary = Column(Text, nullable=False)
    
    competency_breakdown = Column(JSON, default=dict)
    strengths = Column(JSON, default=list)
    areas_for_improvement = Column(JSON, default=list)
    skill_gap_analysis = Column(JSON, default=dict) # Module 04
    integrity_risk_profile = Column(JSON, default=dict) # Module 03 Integrity Intelligence
    decision_intelligence = Column(JSON, default=dict) # Module 05 Candidate Decision Intelligence
    recruiter_feedback = Column(JSON, default=dict) # Recruiter notes & decision status
    
    suggested_practice_questions = Column(JSON, default=list)
    learning_roadmap = Column(JSON, default=list)
    recruiter_next_steps = Column(JSON, default=list)
    confidence_and_limitations = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="report")


class SkillAnalysis(Base):
    __tablename__ = "skill_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    target_role = Column(String(255), nullable=False)
    experience_level = Column(String(50), default="Intermediate")
    custom_job_description = Column(Text, nullable=True)
    overall_match_percentage = Column(Float, default=0.0)
    readiness_status = Column(String(50), default="Needs Focused Upskilling")
    extracted_skills = Column(JSON, default=dict) # categorized candidate skills
    skill_breakdown = Column(JSON, default=list) # detailed list of skills with gap, importance, proficiency
    summary = Column(Text, nullable=True)
    critical_gaps_count = Column(Integer, default=0)
    interview_demonstrated_skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="skill_analyses")
    roadmaps = relationship("LearningRoadmap", back_populates="analysis", cascade="all, delete-orphan")


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    analysis_id = Column(Integer, ForeignKey("skill_analyses.id"), nullable=True)
    target_role = Column(String(255), nullable=False)
    daily_commitment = Column(String(50), default="1h") # 30m, 1h, 2h
    timeline_weeks = Column(Integer, default=4) # 2, 4, 8
    milestones = Column(JSON, default=list) # list of weekly milestones with tasks, resources, and portfolio blueprints
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")
    analysis = relationship("SkillAnalysis", back_populates="roadmaps")


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    target_proficiency = Column(Integer, default=3) # 1-5 scale
    current_proficiency = Column(Integer, default=1) # 1-5 scale
    status = Column(String(50), default="not_started") # not_started, in_progress, completed, verified
    notes = Column(Text, nullable=True)
    checklist = Column(JSON, default=list) # [{id, text, completed}]
    reassessment_score = Column(Float, nullable=True)
    reassessment_passed = Column(Boolean, default=False)
    reassessment_date = Column(DateTime, nullable=True)
    last_studied_at = Column(DateTime, nullable=True)
    streak_days = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="skill_progress")
