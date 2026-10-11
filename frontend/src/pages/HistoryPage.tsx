import React, { useState, useEffect } from 'react';
import { History, Search, FileText, Play } from 'lucide-react';
import { listAllInterviews } from '../services/api';
import type { InterviewSession } from '../types';

interface HistoryPageProps {
  onViewReport: (sessionId: string) => void;
  onResumeInterview: (sessionId: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onViewReport,
  onResumeInterview
}) => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredSessions = sessions.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.role || '').toLowerCase().includes(term) ||
      (s.job_title || '').toLowerCase().includes(term) ||
      (s.candidate_name || '').toLowerCase().includes(term) ||
      (s.status || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8 space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <History className="w-3.5 h-3.5 text-blue-600" />
            Interview Archives
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Historical Assessments & Sessions
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-normal">
            Review past candidate performance reports, resumes, and active sessions.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search role, candidate..."
            className="input-theme pl-9 pr-4 text-xs font-medium"
          />
        </div>
      </div>

      <div className="card-theme p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm font-semibold flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading archive history...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-medium">
            No interview history found matching your search.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredSessions.map((session) => (
              <div
                key={session.session_id}
                className="p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500/50 bg-slate-50/50 dark:bg-white/[0.02] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {session.role || session.job_title}
                    </h3>
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
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>
                      Candidate: <strong className="text-slate-800 dark:text-slate-200">{session.candidate_name}</strong>
                    </span>
                    <span>Mode: {session.mode}</span>
                    <span>Duration: {session.duration_minutes} mins</span>
                    <span>Questions: {session.qa_history?.length || 0}</span>
                  </div>
                </div>

                <div>
                  {session.status === 'completed' ? (
                    <button
                      onClick={() => onViewReport(session.session_id)}
                      className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Report
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeInterview(session.session_id)}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Resume Session
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

export default HistoryPage;
