from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
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
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    
    role = Column(String(255), nullable=False) # e.g. "Python Developer Intern"
    target_difficulty = Column(String(50), default="intermediate") # beginner, intermediate, advanced
    duration_minutes = Column(Integer, default=20) # 10, 20, 30
    mode = Column(String(50), default="text") # text, voice
    interview_type = Column(String(50), default="mixed") # technical, behavioral, project_based, mixed
    
    status = Column(String(50), default="created") # created, in_progress, completed
    competency_map = Column(JSON, default=dict) # dynamic state of competencies
    
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    confidence = Column(Float, default=0.9)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="qa_pairs")


class EvaluationReport(Base):
    __tablename__ = "evaluation_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.id"), nullable=False, unique=True)
    
    overall_score = Column(Float, default=0.0) # 0 - 100 percentage or 0 - 4 scale
    summary = Column(Text, nullable=False)
    
    competency_breakdown = Column(JSON, default=dict)
    strengths = Column(JSON, default=list)
    areas_for_improvement = Column(JSON, default=list)
    skill_gap_analysis = Column(JSON, default=dict) # Claimed vs Required vs Demonstrated
    suggested_practice_questions = Column(JSON, default=list)
    learning_roadmap = Column(JSON, default=list)
    recruiter_next_steps = Column(JSON, default=list)
    confidence_and_limitations = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="report")
