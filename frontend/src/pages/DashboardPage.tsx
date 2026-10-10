import React, { useState, useEffect } from 'react';
import {
  Brain,
  PlusCircle,
  Clock,
  Award,
  CheckCircle2,
  ChevronRight,
  Play,
  FileText,
  AlertCircle
} from 'lucide-react';
import { listAllInterviews } from '../services/api';
import type { InterviewSession } from '../types';

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
  
  // Calculate average score of completed interviews
  let totalScoreSum = 0;
  completedInterviews.forEach((s) => {
    // If competency map has scores
    const mapVals = Object.values(s.competency_map);
    if (mapVals.length > 0) {
      const avgComp = mapVals.reduce((acc, curr) => acc + (curr.score || 0), 0) / mapVals.length;
      totalScoreSum += (avgComp / 4.0) * 100;
    }
  });

  const avgOverallScore = completedInterviews.length
    ? Math.round(totalScoreSum / completedInterviews.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidate Dashboard</h1>
          <p className="text-slate-400 text-sm">
            Manage your AI interview sessions, performance history, and skill reports.
          </p>
        </div>

        <button
          onClick={onStartNew}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Start New Interview
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white">{totalInterviews}</span>
            <p className="text-xs text-slate-400 font-medium">Total Sessions</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white">
              {avgOverallScore ? `${avgOverallScore}%` : 'N/A'}
            </span>
            <p className="text-xs text-slate-400 font-medium">Average Performance</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white">{completedInterviews.length}</span>
            <p className="text-xs text-slate-400 font-medium">Completed Reports</p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Interview History & Active Sessions
          </h3>
          <span className="text-xs text-slate-400 font-medium">{sessions.length} Sessions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Loading interviews...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">No interview sessions found yet.</p>
            <button
              onClick={onStartNew}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30"
            >
              Start your first AI interview
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{session.role}</span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {session.target_difficulty}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        session.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {session.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Candidate: <strong className="text-slate-200">{session.candidate_name}</strong></span>
                    <span>Duration: {session.duration_minutes} mins</span>
                    <span>Questions: {session.qa_history?.length || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {session.status === 'completed' ? (
                    <button
                      onClick={() => onViewReport(session.session_id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Report
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeInterview(session.session_id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Continue Interview
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
