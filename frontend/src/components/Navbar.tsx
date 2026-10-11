import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  BarChart3,
  History,
  PlusCircle,
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  Home,
  Settings,
  LogIn,
  UserPlus,
  User,
  Briefcase,
  TrendingUp,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { checkSystemStatus } from '../services/api';
import type { SystemStatusResponse } from '../services/api';
import SettingsModal from './SettingsModal';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const status = await checkSystemStatus();
      setSystemStatus(status);
      setFetchError(false);
    } catch (e) {
      console.error('Failed to verify backend AI status:', e);
      setFetchError(true);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 90000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    setActiveTab('landing');
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="h-[72px] sticky top-0 z-40 bg-white/85 dark:bg-[#080B16]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 px-4 lg:px-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          
          {/* Left: Brand Logo & Title */}
          <div
            onClick={() => handleNavClick(isAuthenticated ? 'dashboard' : 'landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  ProofHire
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Adaptive Interview Intelligence
              </p>
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-[#0D1224]/80 p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            {!isAuthenticated ? (
              /* Signed-out Links: Home | Features | Sign In | Create Account */
              <>
                <button
                  onClick={() => handleNavClick('landing')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'landing'
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>

                <button
                  onClick={() => handleNavClick('features')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'features'
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Features</span>
                </button>

                <button
                  onClick={() => handleNavClick('signin')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'signin'
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => handleNavClick('signup')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'signup'
                      ? 'btn-primary shadow-sm'
                      : 'bg-blue-600/10 text-blue-700 dark:text-blue-400 hover:bg-blue-600/20'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </>
            ) : (
              /* Signed-in Candidate Links: Dashboard | Start Interview | My Resume | Interview History | Skill Analytics | Settings | Profile */
              <>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavClick('setup')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'setup' || activeTab === 'interview'
                      ? 'btn-primary shadow-sm'
                      : 'bg-blue-600/10 text-blue-700 dark:text-blue-400 hover:bg-blue-600/20'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Start Interview</span>
                </button>

                <button
                  onClick={() => handleNavClick('my-resume')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'my-resume'
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>My Resume</span>
                </button>

                <button
                  onClick={() => handleNavClick('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Interview History</span>
                </button>

                <button
                  onClick={() => handleNavClick('skill-gap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'skill-gap' || activeTab === 'analytics'
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>Skill Gap Analysis</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleNavClick('recruiter')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'recruiter'
                        ? 'bg-purple-600 text-white shadow-xs font-bold'
                        : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Recruiter Hub</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right: AI Status, Settings, Theme & User Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* AI Status Indicator */}
            <div
              onClick={() => setShowSettingsModal(true)}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/5"
              title={
                fetchError
                  ? 'Connection Error: Backend unreachable'
                  : systemStatus?.ai_connected
                  ? `AI Connected: ${systemStatus.model || 'Gemini Flash'} verified by backend`
                  : `AI Fallback: ${systemStatus?.ai_message || 'GEMINI_API_KEY not configured'}`
              }
            >
              {statusLoading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                  <span className="text-slate-500 font-semibold text-[11px] hidden sm:inline">
                    AI Checking...
                  </span>
                </>
              ) : fetchError ? (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-bold text-[11px] hidden sm:inline">Connection Error</span>
                </div>
              ) : systemStatus?.ai_connected ? (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-[11px] tracking-tight">AI Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-semibold text-[11px]">AI Fallback</span>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-all"
              title="Platform Settings & Administration"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-all"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle color theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Authenticated Candidate Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[100px] truncate">
                    {user.name}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold hidden md:inline">
                      ADMIN
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0D1224] border border-slate-200 dark:border-white/10 shadow-2xl py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/10">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {isAdmin ? 'Administrator' : 'Candidate'}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => handleNavClick('profile')}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 font-medium"
                      >
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span>Profile & ID</span>
                      </button>

                      <button
                        onClick={() => handleNavClick('my-resume')}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 font-medium"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-violet-500" />
                        <span>My Resume</span>
                      </button>

                      <button
                        onClick={() => handleNavClick('skill-gap')}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 font-medium"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span>Skill Gap Analysis</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowSettingsModal(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 font-medium"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Settings</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-white/10">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Signed-out Quick Sign In Pill (mobile / fallback) */
              <button
                onClick={() => handleNavClick('signin')}
                className="lg:hidden px-3 py-1.5 rounded-xl btn-primary text-xs font-bold"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-[72px] left-0 right-0 bg-white dark:bg-[#080B16] border-b border-slate-200 dark:border-white/10 p-4 shadow-2xl space-y-2 animate-fadeIn z-50">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavClick('landing')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <Home className="w-4 h-4 text-blue-500" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => handleNavClick('features')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span>Features</span>
                </button>
                <button
                  onClick={() => handleNavClick('signin')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <LogIn className="w-4 h-4 text-blue-500" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => handleNavClick('signup')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-500" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => handleNavClick('setup')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Start Interview</span>
                </button>
                <button
                  onClick={() => handleNavClick('my-resume')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <Briefcase className="w-4 h-4 text-violet-500" />
                  <span>My Resume</span>
                </button>
                <button
                  onClick={() => handleNavClick('history')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <History className="w-4 h-4 text-indigo-500" />
                  <span>Interview History</span>
                </button>
                <button
                  onClick={() => handleNavClick('skill-gap')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>Skill Gap Analysis</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNavClick('recruiter')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Recruiter Hub</span>
                  </button>
                )}
                <button
                  onClick={() => handleNavClick('profile')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Profile & ID</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between px-2">
              <button
                onClick={() => {
                  setShowSettingsModal(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Settings className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Settings
              </button>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          systemStatus={systemStatus}
          onStatusUpdated={fetchStatus}
        />
      )}
    </>
  );
};

export default Navbar;
