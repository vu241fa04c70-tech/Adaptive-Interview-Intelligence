import React, { useState } from 'react';
import {
  Mail,
  Shield,
  Calendar,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  LogOut,
  Sparkles,
  ExternalLink,
  Briefcase,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  onStartInterview: () => void;
  onViewResume: () => void;
  onViewHistory: () => void;
  onViewAnalytics: () => void;
  onOpenRecruiter?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onStartInterview,
  onViewResume,
  onViewHistory,
  onViewAnalytics,
  onOpenRecruiter
}) => {
  const { user, isAdmin, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-20 text-slate-500">
        Please sign in to view your profile.
      </div>
    );
  }

  const copyUserId = () => {
    if (user.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Active member';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Profile Header Banner */}
      <div className="card-theme p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-blue-500/30">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {isAdmin ? 'Platform Administrator' : 'Verified Candidate'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center gap-2 transition-colors self-end sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* User Identity Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
          
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Unique User ID
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate">
                {user.id}
              </span>
              <button
                onClick={copyUserId}
                title="Copy User ID"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Account Registered
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Auth Provider & Status
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span className="capitalize">{user.auth_provider || 'Email / Password'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold ml-auto">
                ACTIVE
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div
          onClick={onStartInterview}
          className="card-theme p-5 rounded-xl border border-slate-200/90 dark:border-white/10 hover:border-blue-500/50 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
              Start Interview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Adaptive AI session with live voice and vision integrity.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>Launch</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={onViewResume}
          className="card-theme p-5 rounded-xl border border-slate-200/90 dark:border-white/10 hover:border-violet-500/50 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-500 transition-colors">
              My Resume
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect stored skills, projects, and parsed credentials.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400">
            <span>View Resume</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={onViewHistory}
          className="card-theme p-5 rounded-xl border border-slate-200/90 dark:border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
              Interview History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review past Q&A transcripts and evaluation scorecards.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span>Review History</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={onViewAnalytics}
          className="card-theme p-5 rounded-xl border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
              Skill Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track mastery progression across core engineering competencies.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>View Progress</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Admin Quick Banner (If user has Admin role) */}
      {isAdmin && onOpenRecruiter && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-blue-900/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-purple-400 uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Administrator Privileges Active</span>
            </div>
            <p className="text-xs text-slate-300">
              You have access to the cross-candidate recruiter intelligence hub and platform AI controls.
            </p>
          </div>
          <button
            onClick={onOpenRecruiter}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-colors shrink-0"
          >
            <span>Open Recruiter Hub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
