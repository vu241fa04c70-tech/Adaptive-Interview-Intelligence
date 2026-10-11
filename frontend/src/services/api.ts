import type {
  ParsedResume,
  InterviewSession,
  SubmitAnswerResponse,
  FinalReport,
  RecruiterAnalytics,
  PresetCandidate,
  User,
  AuthResponse,
  MyResumeResponse,
  SkillAnalysisData,
  RoleComparisonData,
  LearningRoadmapData,
  ProgressOverview,
  QuizQuestion,
  QuizEvaluationResult
} from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'proofhire_auth_token';

// -------------------------------------------------------------
// Token Helpers
// -------------------------------------------------------------
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed');
  }
  const result: AuthResponse = await res.json();
  if (result.access_token) {
    setStoredToken(result.access_token);
  }
  return result;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Invalid email or password');
  }
  const result: AuthResponse = await res.json();
  if (result.access_token) {
    setStoredToken(result.access_token);
  }
  return result;
}

export async function googleLogin(
  credential?: string,
  clientId?: string,
  email?: string,
  name?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential: credential || 'direct_google',
      client_id: clientId,
      email,
      name
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Google sign-in failed');
  }
  const result: AuthResponse = await res.json();
  if (result.access_token) {
    setStoredToken(result.access_token);
  }
  return result;
}

export async function sendPasswordResetOtp(email: string): Promise<{
  success: boolean;
  message: string;
  masked_email?: string;
  expires_in_seconds?: number;
}> {
  const res = await fetch(`${API_BASE}/auth/forgot-password/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to send verification code. Please check your email.');
  }
  return res.json();
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string,
  newPassword: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, new_password: newPassword })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Verification failed. Invalid or expired OTP code.');
  }
  const result: AuthResponse = await res.json();
  if (result.access_token) {
    setStoredToken(result.access_token);
  }
  return result;
}

export async function getCurrentUser(): Promise<User> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token available');
  }
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    removeStoredToken();
    throw new Error('Session expired or unauthorized');
  }
  return res.json();
}

export async function logoutUser(): Promise<void> {
  const token = getStoredToken();
  try {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } finally {
    removeStoredToken();
  }
}

export async function resetPassword(email: string, new_password: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, new_password })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Password reset failed');
  }
  return res.json();
}

export async function fetchAdminUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/auth/admin/users`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch platform users');
  }
  return res.json();
}

// -------------------------------------------------------------
// System & AI Configuration
// -------------------------------------------------------------
export interface SystemStatusResponse {
  status: string;
  ai_connected: boolean;
  ai_message?: string;
  mode: string;
  model?: string;
  gemini_api_key_configured: boolean;
}

export async function checkSystemStatus(): Promise<SystemStatusResponse> {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function verifyApiKey(key: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/system/verify-key`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ api_key: key })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to verify API key. Administrator access required.');
  }
  return res.json();
}

export async function getPresets(): Promise<PresetCandidate[]> {
  const res = await fetch(`${API_BASE}/system/presets`);
  if (!res.ok) throw new Error('Failed to load presets');
  return res.json();
}

// -------------------------------------------------------------
// Resume Endpoints
// -------------------------------------------------------------
export async function parseResumeFile(file: File): Promise<{
  success: boolean;
  candidate_id?: number;
  raw_text: string;
  parsed: ParsedResume;
}> {
  const formData = new FormData();
  formData.append('file', file);
  
  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/resume/parse`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!res.ok) throw new Error('Failed to parse resume file');
  return res.json();
}

export async function parseResumeText(text: string): Promise<{
  success: boolean;
  candidate_id?: number;
  raw_text: string;
  parsed: ParsedResume;
}> {
  const formData = new FormData();
  formData.append('raw_text', text);

  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/resume/parse`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!res.ok) throw new Error('Failed to parse resume text');
  return res.json();
}

export async function fetchMyResume(): Promise<MyResumeResponse> {
  const res = await fetch(`${API_BASE}/resume/my-resume`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    throw new Error('Failed to fetch candidate resume');
  }
  return res.json();
}

// -------------------------------------------------------------
// Interview Endpoints
// -------------------------------------------------------------
export async function createInterviewSession(payload: {
  candidate_name: string;
  candidate_email?: string;
  parsed_skills: string[];
  parsed_projects: any[];
  parsed_experience: any[];
  parsed_education: any[];
  parsed_technologies: string[];
  raw_resume_text?: string;
  job_title: string;
  job_description_text: string;
  duration_minutes: number;
  target_difficulty: string;
  interview_type: string;
  mode: string;
}): Promise<InterviewSession> {
  const res = await fetch(`${API_BASE}/interviews/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create interview session');
  }
  return res.json();
}

export async function fetchInterviewSession(sessionId: string): Promise<InterviewSession> {
  const res = await fetch(`${API_BASE}/interviews/${sessionId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch interview session');
  }
  return res.json();
}

export async function startInterview(sessionId: string): Promise<{
  session_id: string;
  status: string;
  first_question: {
    question_index: number;
    question_text: string;
    question_type: string;
    target_competency: string;
    difficulty: string;
    reason_for_next_question: string;
  };
}> {
  const res = await fetch(`${API_BASE}/interviews/${sessionId}/start`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to start interview');
  return res.json();
}

export async function submitAnswer(
  sessionId: string,
  answerText: string,
  answerTimeSeconds: number = 20.0
): Promise<SubmitAnswerResponse> {
  const res = await fetch(`${API_BASE}/interviews/${sessionId}/answer`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      answer_text: answerText,
      answer_time_seconds: answerTimeSeconds
    })
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

export async function endInterview(sessionId: string): Promise<{ status: string; session_id: string }> {
  const res = await fetch(`${API_BASE}/interviews/${sessionId}/end`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to end interview');
  return res.json();
}

export async function fetchInterviewReport(sessionId: string): Promise<FinalReport> {
  const res = await fetch(`${API_BASE}/interviews/${sessionId}/report`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch evaluation report');
  }
  return res.json();
}

export async function listAllInterviews(): Promise<InterviewSession[]> {
  const res = await fetch(`${API_BASE}/interviews`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to list interviews');
  return res.json();
}

export async function fetchRecruiterAnalytics(): Promise<RecruiterAnalytics> {
  const res = await fetch(`${API_BASE}/recruiter/analytics`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch recruiter analytics. Administrator access required.');
  }
  return res.json();
}

export async function sendIntegrityEvent(
  sessionId: string,
  eventType: string,
  details?: string,
  confidence: number = 0.9
): Promise<{ success: boolean; total_events: number; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/interviews/${sessionId}/integrity-event`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        event_type: eventType,
        details: details || '',
        confidence
      })
    });
    if (!res.ok) return { success: false, total_events: 0, message: 'Failed to record event' };
    return res.json();
  } catch (err) {
    return { success: false, total_events: 0, message: 'Network error recording event' };
  }
}

// -------------------------------------------------------------
// Skill Gap Analysis & Career Growth Services
// -------------------------------------------------------------
export async function fetchSupportedRoles(): Promise<{
  supported_roles: string[];
  categories: Record<string, string>;
}> {
  const res = await fetch(`${API_BASE}/skill-gap/roles`);
  if (!res.ok) throw new Error('Failed to load supported roles');
  return res.json();
}

export async function analyzeSkills(payload: {
  target_role: string;
  experience_level?: string;
  custom_job_description?: string;
  candidate_id?: number;
  raw_resume_text?: string;
  file?: File;
}): Promise<{ success: boolean; analysis_id: number; analysis: SkillAnalysisData }> {
  const formData = new FormData();
  formData.append('target_role', payload.target_role);
  if (payload.experience_level) formData.append('experience_level', payload.experience_level);
  if (payload.custom_job_description) formData.append('custom_job_description', payload.custom_job_description);
  if (payload.candidate_id) formData.append('candidate_id', String(payload.candidate_id));
  if (payload.raw_resume_text) formData.append('raw_resume_text', payload.raw_resume_text);
  if (payload.file) formData.append('file', payload.file);

  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/skill-gap/analyze`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze skills');
  }
  return res.json();
}

export async function fetchLatestSkillAnalysis(): Promise<{
  has_analysis: boolean;
  analysis_id?: number;
  target_role?: string;
  experience_level?: string;
  overall_match_percentage?: number;
  readiness_status?: string;
  summary?: string;
  critical_gaps_count?: number;
  extracted_skills?: Record<string, any[]>;
  skill_breakdown?: any[];
  created_at?: string;
}> {
  const res = await fetch(`${API_BASE}/skill-gap/latest`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch latest skill analysis');
  return res.json();
}

export async function compareTargetRoles(
  roles: string[],
  experience_level?: string,
  candidate_id?: number
): Promise<RoleComparisonData> {
  const res = await fetch(`${API_BASE}/skill-gap/compare-roles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      roles,
      experience_level: experience_level || 'Intermediate',
      candidate_id
    })
  });
  if (!res.ok) throw new Error('Failed to compare roles');
  return res.json();
}

export async function generateLearningRoadmap(payload: {
  analysis_id?: number;
  daily_commitment?: string;
  timeline_weeks?: number;
}): Promise<LearningRoadmapData> {
  const res = await fetch(`${API_BASE}/skill-gap/generate-roadmap`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate learning roadmap');
  }
  return res.json();
}

export async function fetchCurrentRoadmap(): Promise<{
  has_roadmap: boolean;
  roadmap?: LearningRoadmapData;
}> {
  const res = await fetch(`${API_BASE}/skill-gap/roadmap`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch current roadmap');
  const data = await res.json();
  if (data.has_roadmap) {
    return {
      has_roadmap: true,
      roadmap: {
        roadmap_id: data.roadmap_id,
        target_role: data.target_role,
        daily_commitment: data.daily_commitment,
        timeline_weeks: data.timeline_weeks,
        milestones: data.milestones,
        created_at: data.created_at
      }
    };
  }
  return { has_roadmap: false };
}

export async function fetchUserSkillProgress(): Promise<ProgressOverview> {
  const res = await fetch(`${API_BASE}/skill-gap/progress`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch skill progress');
  return res.json();
}

export async function updateUserSkillProgress(payload: {
  skill_name: string;
  status?: string;
  current_proficiency?: number;
  notes?: string;
  checklist?: any[];
}): Promise<{ success: boolean; updated_skill: any }> {
  const res = await fetch(`${API_BASE}/skill-gap/progress/update`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update skill progress');
  return res.json();
}

export async function fetchSkillQuiz(skillName: string): Promise<{
  skill_name: string;
  questions: QuizQuestion[];
  total_questions: number;
  passing_threshold_percentage: number;
}> {
  const res = await fetch(`${API_BASE}/skill-gap/quiz/${encodeURIComponent(skillName)}`);
  if (!res.ok) throw new Error(`Failed to load quiz for ${skillName}`);
  return res.json();
}

export async function submitSkillQuiz(
  skillName: string,
  answers: number[]
): Promise<QuizEvaluationResult> {
  const res = await fetch(`${API_BASE}/skill-gap/quiz/${encodeURIComponent(skillName)}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ answers })
  });
  if (!res.ok) throw new Error(`Failed to submit quiz for ${skillName}`);
  return res.json();
}
