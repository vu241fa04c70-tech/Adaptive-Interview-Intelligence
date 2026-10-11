import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Layers,
  Code2,
  GraduationCap,
  Briefcase,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { fetchMyResume, parseResumeFile, parseResumeText } from '../services/api';
import type { MyResumeResponse } from '../types';

interface MyResumePageProps {
  onStartInterviewWithResume: () => void;
}

export const MyResumePage: React.FC<MyResumePageProps> = ({
  onStartInterviewWithResume
}) => {
  const [resumeData, setResumeData] = useState<MyResumeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [rawText, setRawText] = useState('');

  const loadResume = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyResume();
      setResumeData(data);
    } catch (err: any) {
      setError(err.message || 'Could not load resume.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResume();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await parseResumeFile(file);
      await loadResume();
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume file.');
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setUploading(true);
    setError(null);
    try {
      await parseResumeText(rawText);
      setPasteMode(false);
      setRawText('');
      await loadResume();
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume text.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading your resume records...</p>
      </div>
    );
  }

  const candidate = resumeData?.candidate;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-500" />
            <span>My Resume & Skill Profile</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Persisted candidate credentials used by ProofHire AI to formulate realistic, grounded questions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-4 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center gap-2 shadow-sm">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Parsing...' : 'Upload New Resume'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setPasteMode(!pasteMode)}
            className="px-4 py-2.5 rounded-xl btn-secondary text-xs font-bold flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>{pasteMode ? 'Cancel Paste' : 'Paste Text'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Paste Mode Form */}
      {pasteMode && (
        <div className="card-theme p-6 rounded-2xl border-2 border-blue-500/30 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Paste Resume Markdown or Plain Text</span>
          </h3>
          <form onSubmit={handleTextSubmit} className="space-y-3">
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your resume content, experience, skills, and projects here..."
              className="input-theme w-full text-sm font-mono"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteMode(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2 rounded-xl btn-primary text-xs font-bold disabled:opacity-50"
              >
                {uploading ? 'Analyzing...' : 'Parse & Save Resume'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resume Content View */}
      {candidate ? (
        <div className="space-y-6">
          
          {/* Candidate Overview Card */}
          <div className="card-theme p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-white/10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Active Candidate Profile
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {candidate.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {candidate.email || 'Email not specified'}
                </p>
                {candidate.resume_filename && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>Source: {candidate.resume_filename}</span>
                  </p>
                )}
              </div>

              <button
                onClick={onStartInterviewWithResume}
                className="px-6 py-3 rounded-xl btn-primary text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <span>Practice with this Resume</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Extracted Skills */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Code2 className="w-4 h-4 text-blue-500" />
                <span>Extracted Skills & Competencies ({candidate.skills?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {candidate.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No skills extracted yet.</span>
                )}
              </div>
            </div>

            {/* Projects */}
            {candidate.projects && candidate.projects.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Layers className="w-4 h-4 text-violet-500" />
                  <span>Featured Projects ({candidate.projects.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.projects.map((proj: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 space-y-2"
                    >
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {proj.title || `Project #${idx + 1}`}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {proj.description}
                      </p>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.technologies.map((t: string, tidx: number) => (
                            <span
                              key={tidx}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-violet-500/10 text-violet-700 dark:text-violet-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience & Education */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-white/10">
              
              {/* Experience */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>Work Experience</span>
                </div>
                {candidate.experience && candidate.experience.length > 0 ? (
                  <div className="space-y-2.5">
                    {candidate.experience.map((exp: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1 text-xs"
                      >
                        <div className="font-bold text-slate-900 dark:text-white">
                          {exp.role || 'Role'} • {exp.company || 'Company'}
                        </div>
                        <div className="text-slate-400 text-[11px]">{exp.duration}</div>
                        {exp.highlights && <p className="text-slate-500 dark:text-slate-400">{exp.highlights}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No experience records found.</span>
                )}
              </div>

              {/* Education */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  <span>Education</span>
                </div>
                {candidate.education && candidate.education.length > 0 ? (
                  <div className="space-y-2.5">
                    {candidate.education.map((edu: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1 text-xs"
                      >
                        <div className="font-bold text-slate-900 dark:text-white">
                          {edu.degree || 'Degree'}
                        </div>
                        <div className="text-slate-400 text-[11px]">{edu.institution} {edu.year ? `(${edu.year})` : ''}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No education records found.</span>
                )}
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="card-theme p-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
            <Upload className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              No Resume Uploaded Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload your PDF or DOCX resume to let ProofHire AI automatically extract your skills, past projects, and experience for grounded technical interviews.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <label className="cursor-pointer px-6 py-3 rounded-xl btn-primary text-xs font-bold flex items-center gap-2 shadow-md">
              <Upload className="w-4 h-4" />
              <span>Choose Resume File (PDF/DOCX)</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setPasteMode(true)}
              className="px-5 py-3 rounded-xl btn-secondary text-xs font-bold"
            >
              Paste Text Instead
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
