import type {
  ParsedResume,
  InterviewSession,
  SubmitAnswerResponse,
  FinalReport,
  RecruiterAnalytics,
  PresetCandidate
} from '../types';

const API_BASE = '/api';

export async function checkSystemStatus(): Promise<{
  status: string;
  gemini_api_key_configured: boolean;
  mode: string;
  model: string;
}> {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function verifyApiKey(key: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/system/verify-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key })
  });
  if (!res.ok) throw new Error('Failed to verify API key');
  return res.json();
}

export async function getPresets(): Promise<PresetCandidate[]> {
  const res = await fetch(`${API_BASE}/system/presets`);
  if (!res.ok) throw new Error('Failed to load presets');
  return res.json();
}

export async function parseResumeFile(file: File): Promise<{
  success: boolean;
  candidate_id?: number;
  raw_text: string;
  parsed: ParsedResume;
}> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/resume/parse`, {
    method: 'POST',
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
  const res = await fetch(`${API_BASE}/resume/parse`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to parse resume text');
  return res.json();
}

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create interview session');
  return res.json();
}

export async function fetchInterviewSession(sessionId: string): Promise<InterviewSession> {
  const res = await fetch(`${API_BASE}/interviews/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch interview session');
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
    method: 'POST'
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
    headers: { 'Content-Type': 'application/json' },
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
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to end interview');
  return res.json();
}

export async function fetchInterviewReport(sessionId: string): Promise<FinalReport> {
  const res = await fetch(`${API_BASE}/interviews/${sessionId}/report`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

export async function listAllInterviews(): Promise<InterviewSession[]> {
  const res = await fetch(`${API_BASE}/interviews`);
  if (!res.ok) throw new Error('Failed to list interviews');
  return res.json();
}

export async function fetchRecruiterAnalytics(): Promise<RecruiterAnalytics> {
  const res = await fetch(`${API_BASE}/recruiter/analytics`);
  if (!res.ok) throw new Error('Failed to fetch recruiter analytics');
  return res.json();
}
