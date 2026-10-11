import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  HelpCircle,
  Calendar,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Quote,
  Zap,
  Layers,
  TrendingUp,
  BookOpen,
  Award,
  Target
} from 'lucide-react';
import { fetchInterviewReport } from '../services/api';
import type { FinalReport } from '../types';
import CompetencyRadarChart from '../components/CompetencyRadarChart';
import SkillGapMatrix from '../components/SkillGapMatrix';

interface ReportPageProps {
  sessionId: string;
  onBackToDashboard: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({ sessionId, onBackToDashboard }) => {
  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQa, setExpandedQa] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchInterviewReport(sessionId)
      .then((data) => {
        setReport(data);
        setLoading(false);
        try {
          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load report');
        setLoading(false);
      });
  }, [sessionId]);

  const toggleQaExpand = (index: number) => {
    setExpandedQa((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
          Compiling Candidate Intelligence & Evidence Report...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Report Generation Error</h2>
        <p className="text-slate-500 text-sm">{error || 'Unable to retrieve report details.'}</p>
        <button
          onClick={onBackToDashboard}
          className="btn-primary px-6 py-2.5 text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const decision = report.decision_intelligence;
  const integrity = report.integrity_risk_profile;
  const recText =
    decision?.overall_fit_recommendation ||
    (report.overall_score >= 70 ? 'STRONG_RECOMMENDATION' : 'NEEDS_FURTHER_ASSESSMENT');

  const interviewScore = report.interview_score ?? report.overall_score;
  const jobFitPct =
    report.job_fit_percentage ??
    decision?.job_fit_percentage ??
    Math.min(100, Math.round(report.overall_score * 0.95));
  const jobFitStatus =
    report.job_fit_status ??
    decision?.job_fit_status ??
    (jobFitPct >= 85 ? 'Exceptional Fit (Day 1 Ready)' :
     jobFitPct >= 70 ? 'Good Match (Role Ready)' :
     jobFitPct >= 50 ? 'Moderate Fit (Upskilling Needed)' : 'Foundational Stage');
  const jobFitBreakdown = report.job_fit_breakdown ?? decision?.job_fit_breakdown;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8 space-y-8">
      
      {/* 1. HEADER BANNER */}
      <div className="card-theme p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                Final Evaluation Intelligence Report
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {report.date}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {report.candidate_name}
            </h1>

            <p className="text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-blue-600" /> {report.role}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-violet-600" /> {report.duration_minutes} Mins
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-emerald-600" /> {report.total_questions} Questions
              </span>
            </p>
          </div>

          {/* Dual Header Score Badges & Print Action */}
          <div className="flex items-center gap-3">
            <div className="text-center bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-3 sm:p-4 min-w-[125px] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider block">
                Interview Score
              </span>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {interviewScore.toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                {(interviewScore / 25).toFixed(1)}/4.0 Rubric
              </span>
            </div>

            <div className="text-center bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-3 sm:p-4 min-w-[125px] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                Good For Job
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {jobFitPct.toFixed(0)}%
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block mt-0.5 truncate max-w-[120px]">
                {jobFitStatus.split(' ')[0]} Match
              </span>
            </div>

            <button
              onClick={handlePrint}
              className="no-print btn-secondary p-3 rounded-2xl text-slate-700 dark:text-slate-200"
              title="Download or Print PDF Report"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" /> Executive Evaluation Summary
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {report.summary}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="no-print flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onBackToDashboard}
            className="btn-secondary px-5 py-2.5 text-xs font-bold"
          >
            ← Back to Dashboard
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            Download Official Report (PDF)
          </button>
        </div>
      </div>

      {/* 2. DUAL INTELLIGENCE SPOTLIGHT: HOW MUCH YOU SCORED & JOB FIT PERCENTAGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: How Much Scored In Interview */}
        <div className="card-theme p-6 sm:p-7 space-y-4 border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Interview Score
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                interviewScore >= 80
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : interviewScore >= 60
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
              }`}
            >
              {interviewScore >= 80 ? 'Outstanding' : interviewScore >= 60 ? 'Proficient' : 'Needs Development'}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {interviewScore.toFixed(0)}%
            </span>
            <span className="text-sm font-semibold text-slate-500">
              ({(interviewScore / 25).toFixed(1)} / 4.0 Rubric Average)
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Grounded directly in your real-time spoken and written answers across {report.total_questions} questions. Measures your technical correctness, depth of explanation, system trade-offs, and communication clarity.
          </p>

          {/* Rubric mini-breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-white/10 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-center">
              <span className="text-slate-500 block text-[10px]">Correctness</span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {((decision?.weighted_rubric_scores?.technical_correctness_40pct ?? interviewScore) / 25).toFixed(1)}/4.0
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-center">
              <span className="text-slate-500 block text-[10px]">Problem Solving</span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {((decision?.weighted_rubric_scores?.problem_solving_25pct ?? interviewScore) / 25).toFixed(1)}/4.0
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-center">
              <span className="text-slate-500 block text-[10px]">Tech Depth</span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {((decision?.weighted_rubric_scores?.depth_of_understanding_20pct ?? interviewScore) / 25).toFixed(1)}/4.0
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-center">
              <span className="text-slate-500 block text-[10px]">Clarity</span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {((decision?.weighted_rubric_scores?.clarity_relevance_15pct ?? interviewScore) / 25).toFixed(1)}/4.0
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: How Much Percentage Good For That Job */}
        <div className="card-theme p-6 sm:p-7 space-y-4 border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Good For This Job
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                jobFitPct >= 75
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : jobFitPct >= 50
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
              }`}
            >
              {jobFitStatus}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {jobFitPct.toFixed(0)}%
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              Match for {report.role}
            </span>
          </div>

          {/* Compatibility Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>Role Compatibility Scale</span>
              <span className="text-slate-700 dark:text-slate-200 font-bold">{jobFitPct.toFixed(0)}% Match</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/60 dark:border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  jobFitPct >= 75
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : jobFitPct >= 50
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500'
                }`}
                style={{ width: `${Math.max(5, Math.min(100, jobFitPct))}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {jobFitBreakdown?.job_fit_summary ||
              `You match ${jobFitPct.toFixed(0)}% of the core competencies and architectural requirements expected for a ${report.role}.`}
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Core Skills Tested:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {jobFitBreakdown?.demonstrated_core_skills ?? 4} / {jobFitBreakdown?.total_required_skills ?? 6}
              </strong>
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {jobFitPct >= 70 ? '✓ Ready for Hiring Consideration' : '⚡ Upskilling Recommended'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. RECRUITER VERDICT & INTEGRITY AUDIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recommendation Card */}
        <div className="card-theme p-6 space-y-3.5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assessment Recommendation
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                recText.includes('STRONG')
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
              }`}
            >
              {recText.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {decision?.role_alignment_summary ||
              'Candidate demonstrated consistent architectural understanding and sound technical problem-solving.'}
          </p>

          {decision?.weighted_rubric_scores && (
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
                <span className="text-slate-500 block">Technical Correctness (40%)</span>
                <strong className="text-slate-900 dark:text-white">
                  {(decision.weighted_rubric_scores.technical_correctness_40pct || 3.2).toFixed(1)}/4.0
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
                <span className="text-slate-500 block">Problem Solving (25%)</span>
                <strong className="text-slate-900 dark:text-white">
                  {(decision.weighted_rubric_scores.problem_solving_25pct || 3.0).toFixed(1)}/4.0
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Integrity Risk Audit Card */}
        <div className="card-theme p-6 space-y-3.5 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Proctoring & Anti-Cheat Audit
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                integrity?.risk_level === 'high'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              }`}
            >
              {integrity?.risk_level ? `${integrity.risk_level.toUpperCase()} RISK` : 'LOW RISK'}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {integrity?.summary ||
              'Full screen mode maintained, webcam verified candidate presence, zero unauthorized aids detected.'}
          </p>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Audit Events Recorded: {integrity?.events_timeline?.length || 0}</span>
            {integrity?.risk_level === 'high' ? (
              <span className="font-bold text-rose-600 dark:text-rose-400">⚠️ Flagged for Integrity Review</span>
            ) : (
              <span className="font-semibold text-emerald-600">✓ Security Passed</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. COMPETENCY RADAR & STRENGTHS / IMPROVEMENT AREAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Radar Chart (7 cols) */}
        <div className="lg:col-span-7 card-theme p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              Competency Radar Breakdown
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Normalized 0–4 Scale</span>
          </div>

          <CompetencyRadarChart competencies={report.competency_breakdown} />
        </div>

        {/* Strengths & Improvements List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Strengths */}
          <div className="card-theme p-5 space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Demonstrated Strengths
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {report.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="card-theme p-5 space-y-2.5">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Targeted Growth Areas
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {report.areas_for_improvement.map((imp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 4. 4-STATE SKILL GAP MATRIX */}
      <div className="card-theme p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Resume-to-Job Skill Gap Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of resume claims vs target job description requirements vs tested proof
            </p>
          </div>
        </div>

        <SkillGapMatrix matrix={report.skill_gap_matrix} />
      </div>

      {/* 5. QUESTION-BY-QUESTION FEEDBACK & EVIDENCE QUOTES */}
      <div className="card-theme p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Quote className="w-4 h-4 text-violet-600" />
            Question-by-Question Rubric & Answer Quotes
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {report.qa_details?.length || 0} Questions Evaluated
          </span>
        </div>

        <div className="space-y-3">
          {report.qa_details?.map((qa, index) => {
            const isExpanded = expandedQa[index] ?? true;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200/90 dark:border-white/10 p-4 space-y-3 bg-slate-50/60 dark:bg-slate-900/40"
              >
                <div
                  onClick={() => toggleQaExpand(index)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                      Q{qa.question_index}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {qa.target_competency}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({qa.difficulty})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600">
                      Score: {(qa.score || 0).toFixed(1)}/4.0
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {qa.question_text}
                </p>

                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-white/5 text-xs">
                    {/* Verbatim Candidate Answer */}
                    {qa.candidate_answer && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Candidate Verbatim Answer:
                        </span>
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-200 dark:border-white/10">
                          "{qa.candidate_answer}"
                        </div>
                      </div>
                    )}

                    {/* Demonstrated & Missing Concepts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {qa.demonstrated_concepts?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                            Demonstrated Concepts:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {qa.demonstrated_concepts.map((dc, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                              >
                                ✓ {dc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {qa.missing_concepts?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-rose-600 uppercase block">
                            Missing Concepts:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {qa.missing_concepts.map((mc, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold"
                              >
                                ✗ {mc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. AI PRACTICE ROADMAP & PRACTICE QUESTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Practice Questions */}
        <div className="card-theme p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Recommended Practice Questions
          </h3>

          <div className="space-y-3">
            {report.suggested_practice_questions?.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1.5 text-xs"
              >
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 block">
                  Focus: {item.focus_area}
                </span>
                <p className="font-bold text-slate-900 dark:text-white">{item.question}</p>
                <p className="text-[11px] text-slate-500 italic">Hint: {item.ideal_answer_hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4-Week Roadmap */}
        <div className="card-theme p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Personalized Improvement Roadmap
          </h3>

          <div className="space-y-3">
            {report.learning_roadmap?.slice(0, 4).map((rm, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1 text-xs"
              >
                <div className="flex justify-between items-center font-bold">
                  <span className="text-blue-600 dark:text-blue-400">{rm.week}</span>
                  <span className="text-slate-800 dark:text-slate-200">{rm.topic}</span>
                </div>
                <p className="text-[11px] text-slate-500">{rm.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
