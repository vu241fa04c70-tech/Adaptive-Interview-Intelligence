import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Target,
  FileCheck,
  Mic,
  BarChart2
} from 'lucide-react';
import SamplePresetPicker from '../components/SamplePresetPicker';
import type { PresetCandidate } from '../types';

interface LandingPageProps {
  onStartSetup: (preset?: PresetCandidate) => void;
  onOpenRecruiter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartSetup, onOpenRecruiter }) => {
  return (
    <div className="space-y-16 py-8 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold animate-pulse-slow">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Google Student Club Welcome Hackathon 2026 Edition</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto">
          Realistic Adaptive <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">
            Interview Intelligence Platform
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          ProofHire AI conducts realistic technical interviews based on your resume, target job description, previous answers, and proven competencies — adapting questions in real-time with evidence-backed evaluation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onStartSetup()}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
          >
            Start Technical Interview
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenRecruiter}
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-base flex items-center justify-center gap-2.5 transition-all"
          >
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            Recruiter Dashboard
          </button>
        </div>
      </div>

      {/* Preset Fast Launcher */}
      <SamplePresetPicker onSelectPreset={(preset) => onStartSetup(preset)} />

      {/* Core Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Dynamic Adaptive Engine</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Listens to your actual answers, challenges vague claims, probes project architecture, and adapts question difficulty dynamically — never relying on a fixed static list.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Evidence-Based Rubric</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Evaluates every response on a 0–4 rubric across technical correctness, depth, problem-solving, clarity, and relevance with direct answer quote extraction.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Voice & Speech Synthesis</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Offers Web Speech API speech-to-text transcription and text-to-speech spoken interviewer questions with visual audio equalizer waveforms.
          </p>
        </div>
      </div>

      {/* How It Works Step-by-Step */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white">How ProofHire AI Operates</h2>
          <p className="text-slate-400 text-sm mt-1">End-to-end technical evaluation workflow</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/20">
              01
            </span>
            <h4 className="font-bold text-white text-sm">Resume & JD Setup</h4>
            <p className="text-xs text-slate-400">Upload PDF/DOCX resume and job description. Review parsed skills & projects.</p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/20">
              02
            </span>
            <h4 className="font-bold text-white text-sm">Adaptive Interview</h4>
            <p className="text-xs text-slate-400">Answer dynamic questions in real-time with voice or text response options.</p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/20">
              03
            </span>
            <h4 className="font-bold text-white text-sm">Competency Mapping</h4>
            <p className="text-xs text-slate-400">Scores updated after every answer with internal reasoning for next question.</p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/20">
              04
            </span>
            <h4 className="font-bold text-white text-sm">Evidence Report</h4>
            <p className="text-xs text-slate-400">Comprehensive report with skill gap matrix, radar charts, and learning roadmap.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
