import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  BookOpen,
  HelpCircle,
  BarChart3,
  Calendar,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldAlert
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

  // Accordion state for Q&A details
  const [expandedQa, setExpandedQa] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchInterviewReport(sessionId)
      .then((data) => {
        setReport(data);
        setLoading(false);
        // Trigger confetti celebration on load
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore if canvas non-supported
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load report');
        setLoading(false);
      });
  }, [sessionId]);

  const toggleQaAccordion = (idx: number) => {
    setExpandedQa((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Generating Evidence-Backed Interview Report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Report Generation Failed</h2>
        <p className="text-slate-400 text-sm">{error || 'Unable to retrieve report.'}</p>
        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const scoreColor =
    report.overall_score >= 75
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : report.overall_score >= 50
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8 space-y-8">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Evidence-Backed Evaluation Report
          </span>
          <h1 className="text-3xl font-bold text-white mt-1">{report.candidate_name}</h1>
          <p className="text-slate-400 text-xs">Interview Session #{report.session_id.substring(0, 8)}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium"
          >
            Dashboard
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" /> Export / Print PDF
          </button>
        </div>
      </div>

      {/* Executive Overview Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Candidate & Role Summary */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <Briefcase className="w-4 h-4 text-indigo-400" /> {report.role}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" /> {report.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" /> {report.duration_minutes} Minutes
              </span>
            </div>

            <h3 className="text-xl font-bold text-white">Executive Assessment Summary</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{report.summary}</p>
          </div>

          {/* Overall Percentage Score Badge */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Score</span>
            <div className={`text-4xl font-extrabold px-6 py-2 rounded-2xl border ${scoreColor}`}>
              {report.overall_score}%
            </div>
            <span className="text-xs text-slate-400 font-medium">{report.total_questions} Questions Evaluated</span>
          </div>
        </div>
      </div>

      {/* Competency Radar & Strengths/Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" /> Competency Radar Breakdown
          </h3>
          <CompetencyRadarChart competencies={report.competency_breakdown} />
        </div>

        {/* Strengths & Improvements */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Demonstrated Strengths
            </h4>
            <ul className="space-y-2">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  {str}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Areas for Growth & Assessment
            </h4>
            <ul className="space-y-2">
              {report.areas_for_improvement.map((area, idx) => (
                <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Skill Gap Intelligence Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" /> Resume-to-Job Skill Gap Matrix
        </h3>
        <SkillGapMatrix matrix={report.skill_gap_matrix} />
      </div>

      {/* Question-by-Question Evidence Details */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> Question-by-Question Evidence & Rubric Evaluation
        </h3>

        <div className="space-y-4">
          {report.qa_details.map((qa, idx) => {
            const isExpanded = expandedQa[idx] !== false; // default expanded
            const qScore = qa.score || 0.0;
            const badgeClass =
              qScore >= 3.0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : qScore >= 1.5
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

            return (
              <div key={qa.id} className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div
                  onClick={() => toggleQaAccordion(idx)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      Q{qa.question_index}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Target: {qa.target_competency}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{qa.question_text}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeClass}`}>
                      Score: {qScore.toFixed(1)} / 4.0
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-800/80 space-y-4 text-xs">
                    <div>
                      <span className="font-semibold text-slate-400 block mb-1">Question Text:</span>
                      <p className="text-slate-200 bg-slate-900 p-3 rounded-xl">{qa.question_text}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-400 block mb-1">Candidate's Answer:</span>
                      <p className="text-slate-300 italic bg-slate-900/60 p-3 rounded-xl border-l-2 border-indigo-500">
                        "{qa.candidate_answer || 'No answer submitted.'}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="font-semibold text-emerald-400 block mb-1">Demonstrated Concepts:</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {qa.demonstrated_concepts.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-semibold text-amber-400 block mb-1">Missing / Unclear Details:</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {qa.missing_concepts.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {qa.reason_for_next_question && (
                      <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/20 text-indigo-300">
                        <span className="font-semibold text-indigo-300">AI Adaptive Selection Rationale: </span>
                        {qa.reason_for_next_question}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Practice Questions & Personalized Learning Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Practice Questions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" /> Suggested Practice Questions
          </h3>

          <div className="space-y-3 text-xs">
            {report.suggested_practice_questions.map((pq, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-semibold">{pq.focus_area}</span>
                <p className="font-bold text-white">{pq.question}</p>
                <p className="text-slate-400 italic text-[11px] pt-1">Hint: {pq.ideal_answer_hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Roadmap */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Personalized Learning Roadmap
          </h3>

          <div className="space-y-3 text-xs">
            {report.learning_roadmap.map((rm, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-amber-400">{rm.week}</span>
                <h4 className="font-bold text-white">{rm.topic}</h4>
                <p className="text-slate-400">{rm.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recruiter Next Steps & Confidence Disclaimer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-400" /> Recommended Hiring Committee Next Steps
        </h3>

        <ul className="space-y-2 text-xs text-slate-300">
          {report.recruiter_next_steps.map((step, idx) => (
            <li key={idx} className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              {step}
            </li>
          ))}
        </ul>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>{report.confidence_and_limitations}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
