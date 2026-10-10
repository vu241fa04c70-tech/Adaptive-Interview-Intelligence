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
      s.role.toLowerCase().includes(term) ||
      s.candidate_name.toLowerCase().includes(term) ||
      s.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" /> Interview Session Archives
          </h1>
          <p className="text-slate-400 text-sm">Review past candidate evaluations and active sessions.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role or candidate..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Loading archive history...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No interview history found matching your search.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.session_id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{session.role}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
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

                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    <span>Candidate: <strong className="text-slate-200">{session.candidate_name}</strong></span>
                    <span>Duration: {session.duration_minutes} mins</span>
                    <span>Questions Answered: {session.qa_history?.length || 0}</span>
                  </div>
                </div>

                <div>
                  {session.status === 'completed' ? (
                    <button
                      onClick={() => onViewReport(session.session_id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Evidence Report
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeInterview(session.session_id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" /> Resume Session
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
