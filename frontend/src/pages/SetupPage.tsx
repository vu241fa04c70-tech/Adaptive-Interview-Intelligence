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
  ArrowLeft,
  FileText,
  Code2,
  Database,
  Cpu,
  Layers,
  Clock,
  Check
} from 'lucide-react';
import { parseResumeFile, parseResumeText, createInterviewSession } from '../services/api';
import type { PresetCandidate } from '../types';
import SamplePresetPicker from '../components/SamplePresetPicker';
import { useAuth } from '../context/AuthContext';

interface SetupPageProps {
  initialPreset?: PresetCandidate | null;
  onInterviewCreated: (sessionId: string) => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ initialPreset, onInterviewCreated }) => {
  const { user } = useAuth();

  // Step navigation (Step 1: Resume & Profile, Step 2: Role & Interview Parameters)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Candidate info
  const [candidateName, setCandidateName] = useState(initialPreset?.candidate_name || user?.name || '');
  const [candidateEmail, setCandidateEmail] = useState(initialPreset?.candidate_email || user?.email || '');
  const [rawResumeText, setRawResumeText] = useState(initialPreset?.raw_resume_text || '');
  
  // Parsed Resume state
  const [parsedSkills, setParsedSkills] = useState<string[]>(
    initialPreset?.parsed_skills || []
  );
  const [parsedProjects, setParsedProjects] = useState<Array<{ title: string; description: string; technologies: string[] }>>(
    initialPreset?.parsed_projects || []
  );

  const [parsingLoading, setParsingLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Job Info
  const [selectedRoleType, setSelectedRoleType] = useState<string>('python');
  const [jobTitle, setJobTitle] = useState(initialPreset?.job_title || 'Python Developer Intern');
  const [jobDescriptionText, setJobDescriptionText] = useState(
    initialPreset?.job_description_text ||
      'We are looking for a Python Developer Intern skilled in REST APIs, FastAPI/Django, SQL database design, PyTest, and software architecture.'
  );

  // Config parameters
  const [durationMinutes, setDurationMinutes] = useState<number>(initialPreset?.duration_minutes || 20);
  const [targetDifficulty, setTargetDifficulty] = useState<string>(initialPreset?.target_difficulty || 'intermediate');
  const [interviewType, setInterviewType] = useState<string>(initialPreset?.interview_type || 'mixed');
  const [mode, setMode] = useState<string>('text');

  const [newSkillInput, setNewSkillInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Job Role Presets
  const jobRoleOptions = [
    {
      id: 'python',
      title: 'Python Developer',
      icon: Code2,
      desc: 'FastAPI, Django, SQL databases, asynchronous tasks, unit testing.',
      defaultJd: 'We are seeking a Python Developer skilled in RESTful APIs, FastAPI/Django, SQL queries, testing with PyTest, and asynchronous task queues.'
    },
    {
      id: 'java',
      title: 'Java Developer',
      icon: Cpu,
      desc: 'Spring Boot, Microservices, Hibernate, JVM tuning, OOP patterns.',
      defaultJd: 'We are seeking a Java Software Engineer with expertise in Spring Boot, REST APIs, Hibernate/JPA, relational databases, and clean OOP architecture.'
    },
    {
      id: 'frontend',
      title: 'Frontend Developer',
      icon: Layers,
      desc: 'React, TypeScript, Next.js, state management, modern CSS.',
      defaultJd: 'Looking for a Frontend Developer proficient in React, TypeScript, responsive Tailwind CSS, state management, and modern browser APIs.'
    },
    {
      id: 'fullstack',
      title: 'Full Stack Developer',
      icon: Briefcase,
      desc: 'End-to-end web apps, Node/Python + React, API integration, Docker.',
      defaultJd: 'Seeking a Full Stack Developer experienced in modern web frameworks (React, Node/FastAPI), database architecture, REST endpoints, and deployment.'
    },
    {
      id: 'data',
      title: 'Data Analyst',
      icon: Database,
      desc: 'SQL, Python pandas, statistical analysis, dashboarding, ETL.',
      defaultJd: 'Hiring a Data Analyst proficient in complex SQL queries, data warehousing, Pandas/NumPy analysis, and clear executive reporting.'
    },
    {
      id: 'ml',
      title: 'Machine Learning Engineer',
      icon: Sparkles,
      desc: 'PyTorch, scikit-learn, LLM fine-tuning, model evaluation, MLOps.',
      defaultJd: 'We are hiring an ML Engineer skilled in Python ML libraries, neural network fine-tuning, embedding retrieval, and model evaluation metrics.'
    },
    {
      id: 'custom',
      title: 'Custom Job Role',
      icon: Sliders,
      desc: 'Enter custom role title and custom job description requirements.',
      defaultJd: ''
    }
  ];

  const handleSelectRole = (roleItem: typeof jobRoleOptions[0]) => {
    setSelectedRoleType(roleItem.id);
    if (roleItem.id !== 'custom') {
      setJobTitle(`${roleItem.title} Intern / Junior`);
      setJobDescriptionText(roleItem.defaultJd);
    }
  };

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
    setParseSuccessMsg(`Loaded preset for ${preset.candidate_name}`);
  };

  // Resume File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setParsingLoading(true);
    setUploadProgress(25);
    setParseSuccessMsg(null);
    setErrorMsg(null);
    // Clear out any previous profile data so candidate sees only their actual data
    setCandidateName('');
    setCandidateEmail('');
    setParsedSkills([]);
    setParsedProjects([]);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + 15 : p));
    }, 200);

    try {
      const res = await parseResumeFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      setRawResumeText(res.raw_text);
      if (res.parsed.name && res.parsed.name !== 'Candidate') {
        setCandidateName(res.parsed.name);
      }
      if (res.parsed.email) {
        setCandidateEmail(res.parsed.email);
      }
      setParsedSkills(res.parsed.skills || []);
      setParsedProjects(res.parsed.projects || []);
      setParseSuccessMsg(
        `Resume parsed successfully for ${res.parsed.name || 'Candidate'}! (${res.parsed.skills?.length || 0} skills & ${res.parsed.projects?.length || 0} projects extracted)`
      );
    } catch (err: any) {
      clearInterval(progressInterval);
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
    setCandidateName('');
    setCandidateEmail('');
    setParsedSkills([]);
    setParsedProjects([]);

    try {
      const res = await parseResumeText(rawResumeText);
      if (res.parsed.name && res.parsed.name !== 'Candidate') {
        setCandidateName(res.parsed.name);
      }
      if (res.parsed.email) {
        setCandidateEmail(res.parsed.email);
      }
      setParsedSkills(res.parsed.skills || []);
      setParsedProjects(res.parsed.projects || []);
      setParseSuccessMsg(
        `Resume text parsed successfully for ${res.parsed.name || 'Candidate'}! (${res.parsed.skills?.length || 0} skills extracted)`
      );
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
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 lg:px-8 space-y-8">
      
      {/* Step Progress Bar Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Configure Your AI Interview
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personalize the assessment based on your resume, target role, and preferred difficulty
        </p>

        {/* Step Tabs */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStep === 1
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            Resume & Profile
          </button>

          <span className="text-slate-300 dark:text-slate-700">→</span>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStep === 2
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">
              2
            </span>
            Role & Parameters
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          {errorMsg}
        </div>
      )}

      {/* STEP 1: RESUME UPLOAD & CANDIDATE PROFILE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          
          {/* Quick Preset Picker */}
          <SamplePresetPicker onSelectPreset={handleSelectPreset} />

          {/* Drag & Drop Resume Upload Box */}
          <div className="card-theme p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Upload Resume (PDF / DOCX)
                </h3>
              </div>
              <span className="text-xs text-slate-500">Auto-extracts projects & skills</span>
            </div>

            {/* Drag & Drop Area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-violet-500 rounded-2xl p-8 text-center bg-slate-50/70 dark:bg-slate-900/40 transition-colors relative cursor-pointer group">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-3 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {uploadedFileName ? uploadedFileName : 'Click or drag resume file here'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports PDF, DOCX, or plain text (Max 10MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Or Paste Resume Text */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Or paste resume text directly:
              </label>
              <div className="flex gap-2">
                <textarea
                  value={rawResumeText}
                  onChange={(e) => setRawResumeText(e.target.value)}
                  rows={2}
                  placeholder="Paste summary, skills, and projects text here..."
                  className="input-theme text-xs resize-none"
                />
                <button
                  type="button"
                  onClick={handleTextParse}
                  disabled={parsingLoading || !rawResumeText.trim()}
                  className="btn-secondary px-4 text-xs font-bold whitespace-nowrap self-stretch disabled:opacity-50"
                >
                  Parse Text
                </button>
              </div>
            </div>

            {/* Parsing Progress Bar */}
            {parsingLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Parsing resume with NLP engine...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {parseSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Your profile is ready!</span> {parseSuccessMsg}
                </div>
              </div>
            )}

            {/* Extracted Profile Form */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Extracted Candidate Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="input-theme text-xs"
                    placeholder="e.g. Kanchana Metta (or upload resume)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="input-theme text-xs"
                    placeholder="e.g. kanchana@example.com"
                  />
                </div>
              </div>

              {/* Skills Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Extracted Skills ({parsedSkills.length})
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 min-h-[46px]">
                  {parsedSkills.length === 0 ? (
                    <span className="text-xs text-slate-400 italic py-1">
                      No skills extracted yet. Upload your resume above or add skills below.
                    </span>
                  ) : (
                    parsedSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          className="text-slate-400 hover:text-rose-500 ml-0.5"
                          title="Remove skill"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add additional skill (e.g. Redis, PyTorch)..."
                    className="input-theme text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="btn-secondary px-3 py-1.5 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Extracted Projects Preview */}
              {parsedProjects.length > 0 && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Extracted Projects Grounding ({parsedProjects.length})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedProjects.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/5 space-y-1"
                      >
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          {p.title}
                        </span>
                        {p.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        )}
                        {p.technologies && p.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {p.technologies.slice(0, 4).map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1 Next Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-primary px-6 py-3 text-xs font-bold flex items-center gap-2"
                >
                  Proceed to Interview Parameters
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: INTERVIEW PARAMETERS & ROLE CONFIG */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Target Job Role Selection */}
          <div className="card-theme p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Select Target Job Role
              </h3>
              <span className="text-xs text-slate-500 font-medium">Adapts question focus</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobRoleOptions.map((roleItem) => {
                const Icon = roleItem.icon;
                const isSelected = selectedRoleType === roleItem.id;
                return (
                  <div
                    key={roleItem.id}
                    onClick={() => handleSelectRole(roleItem)}
                    className={`card-theme-interactive p-4 cursor-pointer relative flex flex-col justify-between space-y-2 border-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {roleItem.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {roleItem.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Custom or Editable Job Title & Description */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="input-theme text-xs"
                  placeholder="e.g. Python Developer Intern"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Job Description & Competency Scope
                </label>
                <textarea
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  rows={3}
                  className="input-theme text-xs leading-relaxed"
                  placeholder="Paste target job responsibilities or technologies required..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Difficulty & Type & Duration & Mode Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Interview Type */}
            <div className="card-theme p-5 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Interview Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'technical', label: 'Technical', desc: 'Code & Architecture' },
                  { id: 'behavioral', label: 'HR / Behavioral', desc: 'Leadership & Fit' },
                  { id: 'project_based', label: 'Project-Based', desc: 'Deep Resume Dive' },
                  { id: 'mixed', label: 'Mixed Hybrid', desc: 'Tech + Behavioral' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInterviewType(type.id)}
                    className={`p-3 rounded-xl text-left border-2 transition-all ${
                      interviewType === type.id
                        ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/20'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {type.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {type.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Difficulty */}
            <div className="card-theme p-5 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Target Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'beginner', label: 'Beginner', desc: 'Core basics' },
                  { id: 'intermediate', label: 'Intermediate', desc: 'Production APIs' },
                  { id: 'advanced', label: 'Advanced', desc: 'Distributed Scale' }
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setTargetDifficulty(diff.id)}
                    className={`p-3 rounded-xl text-center border-2 transition-all ${
                      targetDifficulty === diff.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block capitalize">
                      {diff.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {diff.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="card-theme p-5 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { min: 10, label: '10 Mins', desc: 'Quick Sprint (3 Qs)' },
                  { min: 20, label: '20 Mins', desc: 'Standard (5 Qs)' },
                  { min: 30, label: '30 Mins', desc: 'Deep Dive (8 Qs)' }
                ].map((dur) => (
                  <button
                    key={dur.min}
                    type="button"
                    onClick={() => setDurationMinutes(dur.min)}
                    className={`p-3 rounded-xl text-center border-2 transition-all ${
                      durationMinutes === dur.min
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {dur.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {dur.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Mode (Text vs Voice) */}
            <div className="card-theme p-5 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-violet-600" /> Interview Interaction Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'text', label: 'Text Interview', desc: 'Type technical reasoning & architecture with real-time feedback', icon: MessageSquare },
                  { id: 'voice', label: 'Voice Interview', desc: 'AI reads questions aloud; speak your technical answers via browser mic', icon: Mic }
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`p-3 rounded-xl text-left border-2 transition-all flex items-start gap-2.5 ${
                        mode === m.id
                          ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/20'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          {m.label}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {m.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-secondary px-5 py-3 text-xs font-bold flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Resume
            </button>

            <button
              type="submit"
              disabled={submitLoading}
              className="btn-primary px-8 py-3.5 text-sm font-bold flex items-center gap-2.5 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {submitLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Adaptive Rubric...
                </>
              ) : (
                <>
                  Start AI Interview Session
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SetupPage;
