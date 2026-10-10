import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Key, BarChart3, History, PlusCircle, Cpu } from 'lucide-react';
import { checkSystemStatus } from '../services/api';
import ApiKeyModal from './ApiKeyModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    gemini_api_key_configured: boolean;
    mode: string;
  } | null>(null);

  const fetchStatus = async () => {
    try {
      const status = await checkSystemStatus();
      setSystemStatus(status);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <>
      <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  ProofHire
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Adaptive Interview Intelligence</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'landing'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'setup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              New Interview
            </button>

            <button
              onClick={() => setActiveTab('recruiter')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'recruiter'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Recruiter Hub
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* System Status / Mode Badge */}
            <div 
              onClick={() => setShowKeyModal(true)}
              className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
            >
              {systemStatus?.gemini_api_key_configured ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Gemini Live AI
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Adaptive Engine
                  </span>
                </>
              )}
            </div>

            {/* API Key Modal Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Configure Gemini API Key"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">API Key</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Api Key Modal */}
      {showKeyModal && (
        <ApiKeyModal 
          onClose={() => setShowKeyModal(false)}
          onKeyUpdated={fetchStatus}
        />
      )}
    </>
  );
};

export default Navbar;
