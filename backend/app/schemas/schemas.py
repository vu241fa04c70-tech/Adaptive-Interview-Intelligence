from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# Candidate & Resume Schemas
class ParsedResumeData(BaseModel):
    name: str = "Candidate"
    email: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    summary: Optional[str] = None

class ResumeParseRequest(BaseModel):
    text: Optional[str] = None

class ResumeParseResponse(BaseModel):
    success: bool
    candidate_id: Optional[int] = None
    raw_text: str
    parsed: ParsedResumeData

# Job Description Schemas
class JobDescriptionRequest(BaseModel):
    title: str
    company: Optional[str] = "Target Company"
    text: str
    target_role: Optional[str] = None

class JobDescriptionResponse(BaseModel):
    id: int
    title: str
    company: str
    required_skills: List[str]
    preferred_skills: List[str]
    experience_level: str
    domain_focus: Optional[str] = None

# Interview Creation & Config
class CreateInterviewRequest(BaseModel):
    candidate_name: str
    candidate_email: Optional[str] = None
    parsed_skills: List[str] = Field(default_factory=list)
    parsed_projects: List[Dict[str, Any]] = Field(default_factory=list)
    parsed_experience: List[Dict[str, Any]] = Field(default_factory=list)
    parsed_education: List[Dict[str, Any]] = Field(default_factory=list)
    parsed_technologies: List[str] = Field(default_factory=list)
    raw_resume_text: Optional[str] = ""

    job_title: str
    job_description_text: str
    
    duration_minutes: int = 20 # 10, 20, 30
    target_difficulty: str = "intermediate" # beginner, intermediate, advanced
    interview_type: str = "mixed" # technical, behavioral, project_based, mixed
    mode: str = "text" # text, voice

# Module 01 Adaptation Pipeline
class AdaptationPipelineSchema(BaseModel):
    question_area: str
    competency_coverage: str
    question_relevance: str
    difficulty_selection: str
    next_question: str
    reason_for_next_question: str

class QuestionAnswerSchema(BaseModel):
    id: int
    question_index: int
    question_text: str
    question_type: str
    target_competency: Optional[str]
    difficulty: str
    candidate_answer: Optional[str]
    answer_time_seconds: float
    answer_summary: Optional[str]
    demonstrated_concepts: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    score: float
    rubric_scores: Dict[str, float] = Field(default_factory=dict)
    reason_for_next_question: Optional[str]
    adaptation_pipeline: Optional[Dict[str, Any]] = Field(default_factory=dict)
    confidence: float
    created_at: datetime

class CompetencyStatus(BaseModel):
    name: str
    score: float # 0.0 to 4.0
    status: str # "demonstrated", "partially_demonstrated", "claimed_untested", "not_demonstrated", "unassessed"
    evidence_count: int = 0
    tested_questions: List[int] = Field(default_factory=list)

class InterviewSessionResponse(BaseModel):
    session_id: str
    candidate_name: str
    role: str
    job_title: str
    target_difficulty: str
    duration_minutes: int
    interview_type: str
    mode: str
    status: str
    competency_map: Dict[str, CompetencyStatus]
    qa_history: List[QuestionAnswerSchema] = Field(default_factory=list)
    integrity_events_count: int = 0
    created_at: datetime

# Module 03 Integrity Events Schemas
class IntegrityEventRequest(BaseModel):
    event_type: str # TAB_SWITCH, PASTE_DETECTED, SPEECH_PAUSE, AUDIO_ANOMALY, SPEED_ANOMALY, GAZE_DEVIATION
    details: Optional[str] = None
    confidence: float = 0.9

class IntegrityEventResponse(BaseModel):
    success: bool
    event_type: str
    total_events: int
    message: str

class IntegrityRiskProfileSchema(BaseModel):
    risk_level: str # low, medium, high
    risk_score: float # 0 to 100
    summary: str
    events_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    flagged_counts: Dict[str, int] = Field(default_factory=dict)
    requires_human_review: bool = False
    explainable_risk_profile: str

# Submit Answer Schema
class SubmitAnswerRequest(BaseModel):
    answer_text: str
    answer_time_seconds: float = 15.0

class SubmitAnswerResponse(BaseModel):
    session_id: str
    answered_question_index: int
    evaluated_score: float
    answer_summary: str
    demonstrated_concepts: List[str]
    missing_concepts: List[str]
    evidence: List[Dict[str, Any]]
    reason_for_next_question: str
    adaptation_pipeline: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # Next question info
    is_interview_complete: bool
    next_question_index: Optional[int]
    next_question_text: Optional[str]
    next_question_type: Optional[str]
    next_question_difficulty: Optional[str]
    next_target_competency: Optional[str]
    updated_competency_map: Dict[str, CompetencyStatus]

# Module 04 & 05 Report & Decision Schemas
class SkillGapItem(BaseModel):
    competency: str
    claimed_in_resume: bool
    required_by_job: bool
    demonstrated_score: float
    status: str
    evidence_summary: str

class DecisionIntelligenceSchema(BaseModel):
    overall_fit_recommendation: str
    fit_confidence_score: float
    weighted_rubric_scores: Dict[str, float] = Field(default_factory=dict)
    role_alignment_summary: str
    unresolved_uncertainties: List[str] = Field(default_factory=list)
    key_evidence_quotes: List[Dict[str, Any]] = Field(default_factory=list)
    recruiter_action_plan: List[str] = Field(default_factory=list)

class FinalReportResponse(BaseModel):
    session_id: str
    candidate_name: str
    role: str
    date: str
    duration_minutes: int
    total_questions: int
    overall_score: float # 0 - 100
    summary: str
    competency_breakdown: Dict[str, CompetencyStatus]
    strengths: List[str]
    areas_for_improvement: List[str]
    skill_gap_matrix: List[SkillGapItem]
    qa_details: List[QuestionAnswerSchema]
    integrity_risk_profile: Optional[Dict[str, Any]] = Field(default_factory=dict)
    decision_intelligence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    suggested_practice_questions: List[Dict[str, str]]
    learning_roadmap: List[Dict[str, Any]]
    recruiter_next_steps: List[str]
    confidence_and_limitations: str

# Recruiter Dashboard Schemas
class RecruiterCandidateOverview(BaseModel):
    session_id: str
    candidate_name: str
    role: str
    target_difficulty: str
    overall_score: float
    completed_at: str
    status: str
    top_strengths: List[str]
    key_gaps: List[str]
    integrity_risk_level: str = "low"
    decision_recommendation: str = "PROCEED_WITH_DEEP_DIVE"

class RecruiterAnalyticsResponse(BaseModel):
    total_interviews: int
    avg_score: float
    candidates: List[RecruiterCandidateOverview]
    role_benchmarks: Dict[str, float]
