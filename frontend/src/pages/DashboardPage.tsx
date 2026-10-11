import React, { useState, useEffect } from 'react';
import {
  Brain,
  PlusCircle,
  Clock,
  Award,
  CheckCircle2,
  Play,
  FileText,
  AlertCircle,
  TrendingUp,
  Target,
  Sparkles,
  Zap,
  Layers
} from 'lucide-react';
import { listAllInterviews } from '../services/api';
import type { InterviewSession, CompetencyStatus } from '../types';
import CompetencyRadarChart from '../components/CompetencyRadarChart';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onStartNew: () => void;
  onViewReport: (sessionId: string) => void;
  onResumeInterview: (sessionId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartNew,
  onViewReport,
  onResumeInterview
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAllInterviews()
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalInterviews = sessions.length;
  const completedInterviews = sessions.filter((s) => s.status === 'completed');

  // Compute aggregate score
  let totalScoreSum = 0;
  const aggregatedCompetencies: Record<string, CompetencyStatus> = {};

  completedInterviews.forEach((s) => {
    const mapVals = Object.values(s.competency_map || {});
    if (mapVals.length > 0) {
      const avgComp = mapVals.reduce((acc, curr) => acc + (curr.score || 0), 0) / mapVals.length;
      totalScoreSum += (avgComp / 4.0) * 100;

      mapVals.forEach((c) => {
        if (!aggregatedCompetencies[c.name] || (c.score > aggregatedCompetencies[c.name].score)) {
          aggregatedCompetencies[c.name] = c;
        }
      });
    }
  });

  const avgOverallScore = completedInterviews.length
    ? Math.round(totalScoreSum / completedInterviews.length)
    : 0;

  const totalCompetenciesCount = Object.keys(aggregatedCompetencies).length || (completedInterviews.length > 0 ? 8 : 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Candidate Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {user?.name ? `Welcome back, ${user.name}!` : 'Welcome back! Ready for your next interview?'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-normal">
            Track your competency progression, review evidence-backed interview reports, and identify technical focus areas.
          </p>
        </div>

        <button
          onClick={onStartNew}
          className="btn-primary px-6 py-3 text-sm font-bold flex items-center gap-2 self-start md:self-auto shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          Start New Interview
        </button>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="card-theme p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalInterviews}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Interviews</p>
          </div>
        </div>

        <div className="card-theme p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalCompetenciesCount ? `${totalCompetenciesCount}` : '—'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Competencies Tested</p>
          </div>
        </div>

        <div className="card-theme p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {avgOverallScore ? `${avgOverallScore}%` : 'N/A'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Average Score</p>
          </div>
        </div>

        <div className="card-theme p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{completedInterviews.length}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Completed Reports</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Practice Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Competency Radar Chart */}
        <div className="lg:col-span-7 card-theme p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Demonstrated Competency Radar
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Aggregated Performance</span>
          </div>

          {Object.keys(aggregatedCompetencies).length > 0 ? (
            <CompetencyRadarChart competencies={aggregatedCompetencies} />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
              <Target className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-medium">Complete an interview session to generate your competency radar.</p>
              <button onClick={onStartNew} className="btn-secondary px-4 py-2 text-xs font-semibold">
                Start First Session
              </button>
            </div>
          )}
        </div>

        {/* Right: Areas for Improvement & Practice Goals */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Areas for Improvement */}
          <div className="card-theme p-6 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Key Areas for Improvement
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Based on recent evaluation responses, focus on sharpening these concepts:
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Failure Mode Handling</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Articulate specific retry backoffs, circuit breakers, and dead-letter queues.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Database Indexing & Partitioning</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Demonstrate B-tree vs GIN index tradeoffs for complex search filters.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Goals */}
          <div className="card-theme p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Upcoming Practice Goals
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-semibold">
                <span>Reach 80%+ on System Design</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">75% Achieved</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full w-[75%]" />
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-semibold pt-1">
                <span>Complete 3 Advanced Technical Sessions</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">2/3 Done</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[66%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Interview Sessions Activity */}
      <div className="card-theme p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Recent Interview Activity
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{sessions.length} Total Sessions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading recent sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">No interview sessions found yet.</p>
            <button
              onClick={onStartNew}
              className="btn-primary px-5 py-2.5 text-xs inline-flex items-center gap-2"
            >
              Start your first AI interview
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] px-3 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {session.role || session.job_title}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 capitalize border border-slate-200 dark:border-white/10">
                      {session.target_difficulty}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        session.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {session.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                    {session.status === 'completed' && session.qa_history && session.qa_history.length > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        Score: {Math.round((session.qa_history.reduce((acc, q) => acc + (q.score || 0), 0) / (session.qa_history.length * 4.0)) * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Candidate: <strong className="text-slate-700 dark:text-slate-300">{session.candidate_name}</strong> • Mode: {session.mode} • Duration: {session.duration_minutes}m • Questions: {session.qa_history?.length || 0}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {session.status === 'completed' ? (
                    <button
                      onClick={() => onViewReport(session.session_id)}
                      className="btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Report
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeInterview(session.session_id)}
                      className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 font-bold"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Resume Session
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
