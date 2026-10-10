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
  status: string;
  evidence_summary: string;
}

export interface FinalReport {
  session_id: string;
  candidate_name: string;
  role: string;
  date: string;
  duration_minutes: number;
  total_questions: number;
  overall_score: number;
  summary: string;
  competency_breakdown: Record<string, CompetencyStatus>;
  strengths: string[];
  areas_for_improvement: string[];
  skill_gap_matrix: SkillGapItem[];
  qa_details: QuestionAnswer[];
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
