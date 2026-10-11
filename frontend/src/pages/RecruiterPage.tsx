import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  FileText,
  Filter
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
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
          Loading Recruiter Intelligence Roster...
        </p>
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

  const highRiskCount = candidates.filter((c) => c.integrity_risk_level === 'high').length;
  const recommendedCount = candidates.filter((c) => c.overall_score >= 70).length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-bold mb-2">
          <Users className="w-3.5 h-3.5 text-violet-600" />
          Recruiter Intelligence Hub
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Candidate Evaluation Roster & Comparison
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-normal">
          Review evidence-backed competency scores, verbatim answer proofs, and integrity audit trails.
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="card-theme p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Assessed</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{data?.total_interviews || 0}</p>
        </div>

        <div className="card-theme p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{(data?.avg_score || 0).toFixed(0)}%</p>
        </div>

        <div className="card-theme p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Strong Fit</span>
            <UserCheck className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-3xl font-black text-violet-600">{recommendedCount}</p>
        </div>

        <div className="card-theme p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Flagged Integrity</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-rose-500">{highRiskCount}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="card-theme p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate name or role..."
            className="input-theme pl-9 pr-4 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-theme py-1.5 px-3 text-xs font-semibold w-full sm:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="python">Python Developer</option>
            <option value="frontend">Frontend Developer</option>
            <option value="machine learning">Machine Learning</option>
            <option value="java">Java Developer</option>
          </select>
        </div>
      </div>

      {/* Candidate Intelligence Table */}
      <div className="card-theme overflow-hidden p-0">
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Candidate Evaluation Roster</h3>
          <span className="text-xs text-slate-500 font-semibold">{filteredCandidates.length} Candidates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Role & Level</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-4">Integrity Risk</th>
                <th className="py-3 px-4">Key Strengths</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-slate-900 dark:text-white font-medium">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching candidates found.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr
                    key={c.session_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {c.candidate_name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {c.role}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {c.target_difficulty}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block font-black text-sm px-2.5 py-0.5 rounded-full ${
                          c.overall_score >= 75
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : c.overall_score >= 60
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {c.overall_score.toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.integrity_risk_level === 'high'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}
                      >
                        {c.integrity_risk_level === 'high' ? (
                          <>
                            <ShieldAlert className="w-3 h-3 text-rose-500" /> High Risk
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {c.top_strengths?.slice(0, 2).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewReport(c.session_id)}
                        className="btn-secondary px-3 py-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Report
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
