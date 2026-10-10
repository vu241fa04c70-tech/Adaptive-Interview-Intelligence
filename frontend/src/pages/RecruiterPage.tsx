import React, { useState, useEffect } from 'react';
import {
  Users,
  BarChart3,
  Award,
  Search,
  FileText
} from 'lucide-react';
import { fetchRecruiterAnalytics } from '../services/api';
import type { RecruiterAnalytics } from '../types';

interface RecruiterPageProps {
  onViewReport: (sessionId: string) => void;
}

export const RecruiterPage: React.FC<RecruiterPageProps> = ({ onViewReport }) => {
  const [data, setData] = useState<RecruiterAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchRecruiterAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading Recruiter Pool Analytics...</p>
      </div>
    );
  }

  const candidates = data?.candidates || [];

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || c.role.toLowerCase().includes(roleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Recruiter Intelligence Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Comparative candidate evaluations, decision support metrics, and competency benchmarks.
        </p>
      </div>

      {/* Aggregate Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white">{data?.total_interviews || 0}</span>
            <p className="text-xs text-slate-400 font-medium">Evaluated Candidates</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white">{data?.avg_score || 0}%</span>
            <p className="text-xs text-slate-400 font-medium">Pool Average Score</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white">
              {Object.keys(data?.role_benchmarks || {}).length}
            </span>
            <p className="text-xs text-slate-400 font-medium">Role Benchmarks</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidates or roles..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Target Roles</option>
            <option value="python">Python Developer</option>
            <option value="java">Java Developer</option>
            <option value="frontend">Frontend Developer</option>
            <option value="machine">Machine Learning</option>
          </select>
        </div>
      </div>

      {/* Candidates Ranking Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white">Comparative Candidate Pool Ranking</h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Target Role</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-4">Top Strengths</th>
                <th className="py-3 px-4">Key Skill Gaps</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching candidates found.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.session_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {c.candidate_name}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {c.completed_at}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {c.role}
                      <span className="block text-[10px] text-slate-500 capitalize">
                        {c.target_difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block font-extrabold px-3 py-1 rounded-full text-xs border ${
                          c.overall_score >= 75
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : c.overall_score >= 50
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {c.overall_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.top_strengths[0] || 'General technical awareness'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {c.key_gaps[0] || 'System design trade-offs'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewReport(c.session_id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-medium text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecruiterPage;
