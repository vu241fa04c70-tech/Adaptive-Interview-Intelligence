export interface ParsedResume {
  name: string;
  email?: string;
  skills: string[];
  projects: Array<{ title: string; description: string; technologies: string[] }>;
  experience: Array<{ company: string; role: string; duration: string; highlights: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
  technologies: string[];
  summary?: string;
}

export interface CompetencyStatus {
  name: string;
  score: number; // 0 to 4
  status: 'demonstrated' | 'partially_demonstrated' | 'claimed_untested' | 'not_demonstrated' | 'unassessed';
  evidence_count: number;
  tested_questions: number[];
}

export interface AdaptationPipeline {
  question_area: string;
  competency_coverage: string;
  question_relevance: string;
  difficulty_selection: string;
  next_question: string;
  reason_for_next_question: string;
}

export interface QuestionAnswer {
  id: number;
  question_index: number;
  question_text: string;
  question_type: string;
  target_competency?: string;
  difficulty: string;
  candidate_answer?: string;
  answer_time_seconds: number;
  answer_summary?: string;
  demonstrated_concepts: string[];
  missing_concepts: string[];
  evidence: Array<{ point: string; quote: string; status: string }>;
  uncertainties: string[];
  score: number;
  rubric_scores: Record<string, number>;
  reason_for_next_question?: string;
  adaptation_pipeline?: AdaptationPipeline;
  confidence: number;
  created_at: string;
}

export interface InterviewSession {
  session_id: string;
  candidate_name: string;
  role: string;
  job_title: string;
  target_difficulty: string;
  duration_minutes: number;
  interview_type: string;
  mode: string;
  status: string;
  competency_map: Record<string, CompetencyStatus>;
  qa_history: QuestionAnswer[];
  integrity_events_count?: number;
  created_at: string;
}

export interface SubmitAnswerResponse {
  session_id: string;
  answered_question_index: number;
  evaluated_score: number;
  answer_summary: string;
  demonstrated_concepts: string[];
  missing_concepts: string[];
  evidence: Array<{ point: string; quote: string; status: string }>;
  reason_for_next_question: string;
  adaptation_pipeline?: AdaptationPipeline;
  is_interview_complete: boolean;
  next_question_index?: number;
  next_question_text?: string;
  next_question_type?: string;
  next_question_difficulty?: string;
  next_target_competency?: string;
  updated_competency_map: Record<string, CompetencyStatus>;
}

export interface SkillGapItem {
  competency: string;
  claimed_in_resume: boolean;
  required_by_job: boolean;
  demonstrated_score: number;
  status: 'demonstrated' | 'claimed_untested' | 'not_demonstrated' | 'unassessed';
  evidence_summary: string;
}

export interface IntegrityRiskProfile {
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  summary: string;
  events_timeline: Array<{
    event_type: string;
    event_name: string;
    severity: string;
    timestamp: string;
    details: string;
    confidence: number;
  }>;
  flagged_counts: Record<string, number>;
  requires_human_review: boolean;
  explainable_risk_profile: string;
}

export interface DecisionIntelligence {
  overall_fit_recommendation: 'STRONG_RECOMMENDATION' | 'PROCEED_WITH_DEEP_DIVE' | 'NEEDS_FURTHER_ASSESSMENT' | 'HIGH_RISK_DO_NOT_ADVANCE';
  fit_confidence_score: number;
  weighted_rubric_scores: {
    technical_correctness_40pct?: number;
    problem_solving_25pct?: number;
    depth_of_understanding_20pct?: number;
    clarity_relevance_15pct?: number;
  };
  weighted_overall_score?: number;
  interview_score?: number;
  job_fit_percentage?: number;
  job_fit_status?: string;
  job_fit_breakdown?: Record<string, any>;
  role_alignment_summary: string;
  unresolved_uncertainties: string[];
  key_evidence_quotes: Array<{
    question_index: number;
    competency: string;
    score: number;
    point: string;
    quote: string;
  }>;
  recruiter_action_plan: string[];
}

export interface FinalReport {
  session_id: string;
  candidate_name: string;
  role: string;
  date: string;
  duration_minutes: number;
  total_questions: number;
  overall_score: number;
  interview_score?: number;
  job_fit_percentage?: number;
  job_fit_status?: string;
  job_fit_breakdown?: {
    job_fit_percentage?: number;
    job_fit_status?: string;
    job_fit_badge?: string;
    job_fit_summary?: string;
    core_skills_coverage_pct?: number;
    technical_answer_score_pct?: number;
    problem_solving_fit_pct?: number;
    technical_depth_fit_pct?: number;
    demonstrated_core_skills?: number;
    total_required_skills?: number;
  };
  summary: string;
  competency_breakdown: Record<string, CompetencyStatus>;
  strengths: string[];
  areas_for_improvement: string[];
  skill_gap_matrix: SkillGapItem[];
  qa_details: QuestionAnswer[];
  integrity_risk_profile?: IntegrityRiskProfile;
  decision_intelligence?: DecisionIntelligence;
  suggested_practice_questions: Array<{ question: string; focus_area: string; ideal_answer_hint: string }>;
  learning_roadmap: Array<{ week: string; topic: string; action: string }>;
  recruiter_next_steps: string[];
  confidence_and_limitations: string;
}

export interface RecruiterCandidate {
  session_id: string;
  candidate_name: string;
  role: string;
  target_difficulty: string;
  overall_score: number;
  completed_at: string;
  status: string;
  top_strengths: string[];
  key_gaps: string[];
  integrity_risk_level?: string;
  decision_recommendation?: string;
}

export interface RecruiterAnalytics {
  total_interviews: number;
  avg_score: number;
  candidates: RecruiterCandidate[];
  role_benchmarks: Record<string, number>;
}

export interface PresetCandidate {
  id: string;
  candidate_name: string;
  candidate_email: string;
  role: string;
  target_difficulty: string;
  duration_minutes: number;
  interview_type: string;
  parsed_skills: string[];
  parsed_projects: Array<{ title: string; description: string; technologies: string[] }>;
  raw_resume_text: string;
  job_title: string;
  job_description_text: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'admin' | string;
  auth_provider: 'local' | 'google' | string;
  avatar_url?: string;
  created_at: string;
  total_interviews?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MyResumeResponse {
  has_resume: boolean;
  candidate?: {
    id: number;
    name: string;
    email?: string;
    resume_filename?: string;
    raw_text: string;
    skills: string[];
    projects: any[];
    experience: any[];
    education: any[];
    technologies: string[];
    created_at?: string;
  };
}

export interface SkillBreakdownItem {
  skill_name: string;
  category: string;
  category_label: string;
  importance: 'Critical' | 'High' | 'Medium' | 'Low';
  required_proficiency: number;
  estimated_proficiency: number | null;
  gap_level: 'Strong' | 'Minor Gap' | 'Moderate Gap' | 'Critical Gap' | 'Missing';
  status: 'Strong Skill' | 'Skill to Improve' | 'Missing Skill' | 'Unverified Claim';
  evidence_type: string;
  evidence_details: string;
  why_it_matters: string;
  recommended_action: string;
  verified: boolean;
  resource: {
    title: string;
    url: string;
    type: string;
  };
}

export interface SkillAnalysisData {
  target_role: string;
  experience_level: string;
  overall_match_percentage: number;
  readiness_status: string;
  summary: string;
  critical_gaps_count: number;
  strengths_count: number;
  strengths: string[];
  extracted_skills: Record<string, Array<{ name: string; proficiency: number; evidence: string }>>;
  skill_breakdown: SkillBreakdownItem[];
  created_at?: string;
  analysis_id?: number;
}

export interface RoleComparisonItem {
  role: string;
  overall_match: number;
  readiness_status: string;
  critical_gaps: number;
  strengths_count: number;
  estimated_weeks_to_ready: number;
  top_gaps: string[];
  top_strengths: string[];
}

export interface RoleComparisonData {
  roles_compared: RoleComparisonItem[];
  common_transferable_skills: string[];
  recommended_role: string | null;
}

export interface MilestoneTask {
  task_id: string;
  title: string;
  duration_minutes: number;
  resource_title: string;
  resource_url: string;
  resource_type: string;
  exercise: string;
  why_it_matters: string;
}

export interface ProjectBlueprint {
  title: string;
  description: string;
  tech_stack: string[];
  deliverable: string;
}

export interface Milestone {
  week: number;
  phase: string;
  title: string;
  description: string;
  skills_targeted: string[];
  tasks: MilestoneTask[];
  project_blueprint: ProjectBlueprint;
}

export interface LearningRoadmapData {
  roadmap_id?: number;
  target_role: string;
  daily_commitment: string;
  timeline_weeks: number;
  milestones: Milestone[];
  created_at?: string;
}

export interface UserSkillProgressItem {
  id: number;
  skill_name: string;
  category: string;
  category_label: string;
  target_proficiency: number;
  current_proficiency: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'verified';
  notes?: string;
  checklist: Array<{ id: string; text: string; completed: boolean }>;
  reassessment_score?: number;
  reassessment_passed?: boolean;
  reassessment_date?: string;
  streak_days: number;
  last_studied_at?: string;
}

export interface ProgressOverview {
  total_skills: number;
  completed_count: number;
  verified_count: number;
  in_progress_count: number;
  completion_percentage: number;
  streak_days: number;
  skills: UserSkillProgressItem[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
}

export interface QuizEvaluationResult {
  skill_name: string;
  score_percentage: number;
  passed: boolean;
  correct_count: number;
  total_questions: number;
  feedback: Array<{
    question: string;
    user_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation: string;
  }>;
}
