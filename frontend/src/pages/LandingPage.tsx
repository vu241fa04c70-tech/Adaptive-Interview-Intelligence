import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Target,
  FileCheck,
  Mic,
  BarChart2,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Volume2,
  GraduationCap,
  Building2
} from 'lucide-react';
import SamplePresetPicker from '../components/SamplePresetPicker';
import type { PresetCandidate } from '../types';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onStartSetup: (preset?: PresetCandidate) => void;
  onOpenRecruiter: () => void;
  onNavigateSignIn?: () => void;
  onNavigateSignUp?: () => void;
  onNavigateDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSetup,
  onOpenRecruiter,
  onNavigateSignIn,
  onNavigateSignUp,
  onNavigateDashboard
}) => {
  const { isAuthenticated, googleSignIn } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    try {
      const demoToken = `google_oauth_${Date.now()}`;
      await googleSignIn(demoToken);
      if (onNavigateDashboard) onNavigateDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    {
      q: 'How does ProofHire AI adapt questions dynamically to my answers?',
      a: 'Unlike static question banks, ProofHire AI uses Google Gemini 1.5 Flash to analyze your verbatim response. If you mention a specific architecture (e.g. Redis pub/sub or PostgreSQL partitioning), it quotes your words and probes deeper into edge cases, latency tradeoffs, and failure modes.'
    },
    {
      q: 'How does the resume analysis and project extraction work?',
      a: 'When you upload a PDF or DOCX resume, ProofHire extracts your tech stack, project descriptions, and responsibilities. The AI interviewer specifically asks questions grounded in your listed projects to test if you genuinely built what you claim.'
    },
    {
      q: 'What is the AI Vision Guard and how are warnings handled?',
      a: 'The camera vision guard runs client-side frame analysis to verify candidate presence, detect mobile phones or external screen reflections, and check for multiple people in frame. Candidates receive up to 3 gentle warnings before a proctored session is terminated.'
    },
    {
      q: 'Can I do a voice-only interview like a real phone or video screening?',
      a: 'Yes! ProofHire AI supports full Voice Mode utilizing the Web Speech API. The AI speaks questions aloud with lifelike cadence, and your spoken answers are transcribed in real-time with live waveform visualization.'
    },
    {
      q: 'Where is my Gemini API Key stored?',
      a: 'Your API key is securely loaded on the backend from the GEMINI_API_KEY environment variable (backend/.env). Credentials are never exposed to client browsers or frontend source code.'
    }
  ];

  return (
    <div className="space-y-20 py-8 px-4 lg:px-8 max-w-7xl mx-auto">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 pb-12 flex flex-col items-center text-center space-y-8">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/10 via-violet-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />

        {/* Small AI Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/25 text-violet-700 dark:text-violet-300 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span className="uppercase tracking-wider">AI-POWERED INTERVIEW INTELLIGENCE</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-4xl">
          Your Next Interview Starts With{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Intelligence.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg lg:text-xl max-w-2xl font-normal leading-relaxed">
          Practice with an AI interviewer that understands your resume, adapts to your answers, and helps you prove your skills.
        </p>

        {/* Primary & Secondary Action Buttons */}
        <div className="flex flex-col items-center gap-3 w-full z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onStartSetup()}
                  className="w-full sm:w-auto px-8 py-3.5 btn-primary flex items-center justify-center gap-2.5 text-sm sm:text-base font-bold shadow-lg shadow-blue-600/20"
                >
                  <span>Start AI Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onNavigateDashboard && (
                  <button
                    onClick={onNavigateDashboard}
                    className="w-full sm:w-auto px-6 py-3.5 btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base font-bold"
                  >
                    <span>My Dashboard</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {onNavigateSignUp && (
                  <button
                    onClick={onNavigateSignUp}
                    className="w-full sm:w-auto px-8 py-3.5 btn-primary flex items-center justify-center gap-2.5 text-sm sm:text-base font-bold shadow-lg shadow-blue-600/20"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {onNavigateSignIn && (
                  <button
                    onClick={onNavigateSignIn}
                    className="w-full sm:w-auto px-6 py-3.5 btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base font-bold"
                  >
                    <span>Sign In</span>
                  </button>
                )}

                <button
                  onClick={handleGoogleClick}
                  disabled={googleLoading}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xs transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
                </button>
              </>
            )}

            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto px-5 py-3.5 btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
            >
              Explore Features
            </button>

            <button
              onClick={scrollToHowItWorks}
              className="w-full sm:w-auto px-5 py-3.5 btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
            >
              How It Works
            </button>
          </div>

          {!isAuthenticated && (
            <button
              onClick={() => onStartSetup()}
              className="text-xs text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 font-medium underline underline-offset-4 transition-colors pt-1"
            >
              Or try a quick guest interview without account →
            </button>
          )}
        </div>

        {/* Compact Trust Indicators */}
        <div className="pt-2 flex items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Adaptive Questioning</span>
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Resume-Aware Interviews</span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Evidence-Backed Reports</span>
          </div>
        </div>

        {/* 2. ANIMATED HERO ILLUSTRATION / INTERACTIVE MOCKUP */}
        <div className="w-full max-w-4xl mt-6 relative z-10">
          <div className="card-theme p-4 sm:p-6 shadow-2xl border-2 border-slate-200/90 dark:border-white/10 relative overflow-hidden">
            
            {/* Mock Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
                  Live Session • Python Developer Assessment
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  AI Proctor Guard Active
                </span>
              </div>
            </div>

            {/* Mock Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 text-left">
              
              {/* Left Column: AI Interviewer Avatar & Speech */}
              <div className="md:col-span-5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">ProofHire AI Interviewer</h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Voice Synthesizer Active
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 leading-relaxed shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 block mb-1">
                    Adaptive Follow-up Question
                  </span>
                  "You mentioned using Redis pub/sub in your Order API. How did you prevent message loss during broker failovers?"
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Question 2 of 5</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400">Difficulty: Advanced</span>
                </div>
              </div>

              {/* Right Column: Real-time Candidate Feedback & Rubrics */}
              <div className="md:col-span-7 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-600" />
                    Live Competency Demonstration
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    High Confidence
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      <span>Distributed Systems (Redis / Queues)</span>
                      <span className="font-bold text-emerald-600">3.8 / 4.0</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full w-[95%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      <span>Concurrency & Race Conditions</span>
                      <span className="font-bold text-blue-600">3.4 / 4.0</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full w-[85%]" />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  ✓ Verbatim quote verified: "Implemented Redis stream consumer groups with ACK timeouts."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preset Fast Launcher */}
      <SamplePresetPicker onSelectPreset={(preset) => onStartSetup(preset)} />

      {/* 3. SIX KEY FEATURES SECTION */}
      <section id="features-section" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 dark:text-violet-400 uppercase tracking-wider">
            Engineered For Precision
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Built Like a Real Senior Engineering Interview
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm font-normal">
            Every layer is powered by evidence-based grading, dynamic follow-up questioning, and multimodal intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="card-theme-interactive p-6 space-y-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Resume-Based Interviews
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Extracts projects, technical architectures, and metrics from your uploaded PDF/DOCX to ask deep, relevant project-level questions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card-theme-interactive p-6 space-y-3.5">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Real-Time Adaptive Questions
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              The AI evaluates your exact answers, challenges surface-level claims, tests edge cases, and adjusts question difficulty dynamically.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card-theme-interactive p-6 space-y-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Voice Interviewer
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Hands-free voice recognition with live audio waveform bars and spoken interviewer audio via the Web Speech API.
            </p>
          </div>

          {/* Card 4 */}
          <div className="card-theme-interactive p-6 space-y-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Evidence-Based Evaluation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Scores are never arbitrary. Every rating is accompanied by verbatim quotes from your answers, demonstrated concepts, and missing details.
            </p>
          </div>

          {/* Card 5 */}
          <div className="card-theme-interactive p-6 space-y-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Skill Gap Analysis
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              A 4-state matrix mapping skills claimed in your resume vs skills demanded by the target job description vs what you demonstrated.
            </p>
          </div>

          {/* Card 6 */}
          <div className="card-theme-interactive p-6 space-y-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Personalized Learning Roadmap
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Receive a structured 4-week practice curriculum with targeted follow-up questions to turn weak competencies into interview strengths.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (4-STEP JOURNEY) */}
      <section id="how-it-works-section" className="card-theme p-8 sm:p-10 space-y-8 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 dark:text-violet-400 uppercase tracking-wider">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            How ProofHire AI Operates
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs">
            From resume upload to final intelligence scorecard in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-50 dark:bg-[#0D1224] p-5 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-3 relative">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              1
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Upload Resume</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Drag and drop your PDF/DOCX or paste resume text. Our parser detects key skills, projects, and experiences.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#0D1224] p-5 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-3 relative">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              2
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Choose Job Role</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Select Python, Java, Frontend, Full Stack, Data Analyst, ML, or paste a custom role description.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#0D1224] p-5 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-3 relative">
            <span className="w-8 h-8 rounded-xl bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              3
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Attend AI Interview</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Engage with our AI interviewer in full screen. Questions adapt to your exact answers with camera vision proctoring.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#0D1224] p-5 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-3 relative">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              4
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Receive Feedback</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Get an instant evidence report with competency radar charts, skill gap matrix, and a tailored practice roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS FOR STUDENTS & RECRUITERS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* For Students */}
        <div className="card-theme p-8 space-y-5 border-l-4 border-l-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Benefits For Students & Candidates
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Master high-stakes technical interviews with zero anxiety
              </p>
            </div>
          </div>

          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Practice Without Pressure:</strong> Fail safely and receive objective, constructive critique.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Resume Reality Check:</strong> Discover if your claimed skills withstand technical scrutiny.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Verifiable Evidence:</strong> Walk away with concrete proof of your problem-solving depth.</span>
            </li>
          </ul>

          <button
            onClick={() => onStartSetup()}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
          >
            Start Candidate Practice
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* For Recruiters */}
        <div className="card-theme p-8 space-y-5 border-l-4 border-l-violet-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Benefits For Recruiters & Campus Clubs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Standardized screening without recruiter fatigue
              </p>
            </div>
          </div>

          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Standardized 5-Point Rubric:</strong> Consistent grading unaffected by interviewer bias or mood.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Verbatim Quote Proof:</strong> Inspect exact quotes demonstrating architectural mastery.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Anti-Cheating Audit Log:</strong> Clear timeline of tab switches, copy-paste, and video anomalies.</span>
            </li>
          </ul>

          <button
            onClick={onOpenRecruiter}
            className="btn-secondary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
          >
            <BarChart2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            Open Recruiter Intelligence Hub
          </button>
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section className="card-theme p-8 sm:p-10 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 dark:text-violet-400 uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs font-normal">
            Everything you need to know about ProofHire AI and how it works.
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-slate-100 dark:divide-white/10">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left gap-4 text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-violet-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="pt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Ready to Prove Your Engineering Skills?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base font-normal">
            Take a 10-minute proctored practice interview and see your competency breakdown with AI-backed insights.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <button
            onClick={() => onStartSetup()}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            Start Your Interview Now
            <ArrowRight className="w-4 h-4 text-violet-600" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
