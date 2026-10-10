import React, { useState } from 'react';
import {
  Upload,
  Briefcase,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Mic,
  MessageSquare,
  ArrowRight,
  User,
  Plus,
  Trash2
} from 'lucide-react';
import { parseResumeFile, parseResumeText, createInterviewSession } from '../services/api';
import type { PresetCandidate } from '../types';
import SamplePresetPicker from '../components/SamplePresetPicker';

interface SetupPageProps {
  initialPreset?: PresetCandidate | null;
  onInterviewCreated: (sessionId: string) => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ initialPreset, onInterviewCreated }) => {
  // Candidate info
  const [candidateName, setCandidateName] = useState(initialPreset?.candidate_name || 'Alex Chen');
  const [candidateEmail, setCandidateEmail] = useState(initialPreset?.candidate_email || 'alex.chen@example.com');
  const [rawResumeText, setRawResumeText] = useState(initialPreset?.raw_resume_text || '');
  
  // Parsed Resume state
  const [parsedSkills, setParsedSkills] = useState<string[]>(
    initialPreset?.parsed_skills || ['Python', 'FastAPI', 'SQL', 'Git', 'Docker']
  );
  const [parsedProjects, setParsedProjects] = useState<Array<{ title: string; description: string; technologies: string[] }>>(
    initialPreset?.parsed_projects || [
      {
        title: 'Real-time Order API',
        description: 'Built asynchronous REST API handling high concurrency.',
        technologies: ['Python', 'FastAPI', 'Redis']
      }
    ]
  );

  const [parsingLoading, setParsingLoading] = useState(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  // Job Info
  const [jobTitle, setJobTitle] = useState(initialPreset?.job_title || 'Python Developer Intern');
  const [jobDescriptionText, setJobDescriptionText] = useState(
    initialPreset?.job_description_text ||
      'We are looking for a Python Developer Intern skilled in REST APIs, FastAPI/Django, SQL database design, PyTest, and software architecture.'
  );

  // Config
  const [durationMinutes, setDurationMinutes] = useState<number>(initialPreset?.duration_minutes || 20);
  const [targetDifficulty, setTargetDifficulty] = useState<string>(initialPreset?.target_difficulty || 'intermediate');
  const [interviewType, setInterviewType] = useState<string>(initialPreset?.interview_type || 'mixed');
  const [mode, setMode] = useState<string>('text');

  const [newSkillInput, setNewSkillInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load preset handler
  const handleSelectPreset = (preset: PresetCandidate) => {
    setCandidateName(preset.candidate_name);
    setCandidateEmail(preset.candidate_email);
    setJobTitle(preset.job_title);
    setJobDescriptionText(preset.job_description_text);
    setRawResumeText(preset.raw_resume_text);
    setParsedSkills(preset.parsed_skills);
    setParsedProjects(preset.parsed_projects);
    setDurationMinutes(preset.duration_minutes);
    setTargetDifficulty(preset.target_difficulty);
    setInterviewType(preset.interview_type);
  };

  // Resume File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingLoading(true);
    setParseSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await parseResumeFile(file);
      setRawResumeText(res.raw_text);
      if (res.parsed.name && res.parsed.name !== 'Candidate') {
        setCandidateName(res.parsed.name);
      }
      setParsedSkills(res.parsed.skills || []);
      setParsedProjects(res.parsed.projects || []);
      setParseSuccessMsg(`Parsed resume successfully! (${res.parsed.skills.length} skills detected)`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse uploaded resume file.');
    } finally {
      setParsingLoading(false);
    }
  };

  // Resume Text Parse
  const handleTextParse = async () => {
    if (!rawResumeText.trim()) return;

    setParsingLoading(true);
    setParseSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await parseResumeText(rawResumeText);
      setParsedSkills(res.parsed.skills || []);
      setParsedProjects(res.parsed.projects || []);
      setParseSuccessMsg('Resume text parsed successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse resume text.');
    } finally {
      setParsingLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkillInput.trim() && !parsedSkills.includes(newSkillInput.trim())) {
      setParsedSkills([...parsedSkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setParsedSkills(parsedSkills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !jobTitle.trim() || !jobDescriptionText.trim()) {
      setErrorMsg('Please fill in candidate name, job title, and job description.');
      return;
    }

    setSubmitLoading(true);
    setErrorMsg(null);

    try {
      const session = await createInterviewSession({
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        parsed_skills: parsedSkills,
        parsed_projects: parsedProjects,
        parsed_experience: [],
        parsed_education: [],
        parsed_technologies: parsedSkills,
        raw_resume_text: rawResumeText,
        job_title: jobTitle,
        job_description_text: jobDescriptionText,
        duration_minutes: durationMinutes,
        target_difficulty: targetDifficulty,
        interview_type: interviewType,
        mode: mode
      });

      onInterviewCreated(session.session_id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize interview session.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Onboarding & Setup
        </div>
        <h1 className="text-3xl font-bold text-white">Interview Configuration</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload candidate resume, review extracted skills, and customize interview settings.
        </p>
      </div>

      {/* 1-Click Presets */}
      <SamplePresetPicker onSelectPreset={handleSelectPreset} />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Candidate Resume */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <User className="w-5 h-5 text-indigo-400" /> Step 1: Candidate Resume Setup
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Candidate Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Candidate Email</label>
              <input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Upload Resume File */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Upload Resume (PDF / DOCX)
            </label>
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 text-center bg-slate-950/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-indigo-400" />
                <span className="text-xs text-slate-300 font-medium">
                  Click to select PDF or DOCX file
                </span>
                <span className="text-[11px] text-slate-500">Supports PDF, DOCX, TXT up to 10MB</span>
              </label>
            </div>
          </div>

          {/* Or Paste Raw Text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Or Paste Resume Text</label>
              <button
                type="button"
                onClick={handleTextParse}
                disabled={parsingLoading || !rawResumeText.trim()}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" /> Parse Resume Text
              </button>
            </div>
            <textarea
              rows={3}
              value={rawResumeText}
              onChange={(e) => setRawResumeText(e.target.value)}
              placeholder="Paste candidate resume content here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {parseSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {parseSuccessMsg}
            </div>
          )}

          {/* Review & Edit Extracted Skills */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Extracted Resume Skills (Review & Edit)
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {parsedSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add custom skill..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Target Role & Job Description */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Briefcase className="w-5 h-5 text-indigo-400" /> Step 2: Target Role & Job Description
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Role Title</label>
            <select
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Python Developer Intern">Python Developer Intern</option>
              <option value="Java Developer">Java Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Machine Learning Engineer">Machine Learning Engineer</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Description</label>
            <textarea
              rows={4}
              value={jobDescriptionText}
              onChange={(e) => setJobDescriptionText(e.target.value)}
              placeholder="Paste job description requirements..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Step 3: Interview Settings */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-indigo-400" /> Step 3: Interview Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Difficulty</label>
              <select
                value={targetDifficulty}
                onChange={(e) => setTargetDifficulty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Focus Type</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
              >
                <option value="mixed">Mixed Assessment</option>
                <option value="technical">Technical Depth</option>
                <option value="project_based">Project Architecture</option>
                <option value="behavioral">Behavioral & Leadership</option>
              </select>
            </div>
          </div>

          {/* Mode: Text vs Voice */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Interview Interaction Mode</label>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setMode('text')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                  mode === 'text'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Text-Based Interview</h4>
                  <p className="text-[11px] text-slate-400">Type answers directly in standard chat box</p>
                </div>
              </div>

              <div
                onClick={() => setMode('voice')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                  mode === 'voice'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mic className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Voice-Interactive Mode</h4>
                  <p className="text-[11px] text-slate-400">Live speech-to-text STT and TTS voice playback</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Launch Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {submitLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing Adaptive Interview Room...
              </>
            ) : (
              <>
                Launch Adaptive Interview Room
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetupPage;
