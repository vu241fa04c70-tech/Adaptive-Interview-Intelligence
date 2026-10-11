import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SetupPage } from './pages/SetupPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { ReportPage } from './pages/ReportPage';
import { RecruiterPage } from './pages/RecruiterPage';
import { HistoryPage } from './pages/HistoryPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyResumePage } from './pages/MyResumePage';
import { SkillGapPage } from './pages/SkillGapPage';
import type { PresetCandidate } from './types';
import { Brain } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetCandidate | null>(null);

  // Theme Management (Defaults to 'light' per requirements)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('proofhire_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('proofhire_theme', theme);
  }, [theme]);

  // If user signs in while on auth pages, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && (activeTab === 'signin' || activeTab === 'signup')) {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleStartSetup = (preset?: PresetCandidate) => {
    setSelectedPreset(preset || null);
    setActiveTab('setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInterviewCreated = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('interview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishInterview = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewReport = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeInterview = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('interview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guard recruiter tab: non-admins cannot view recruiter hub
  const handleOpenRecruiter = () => {
    if (!isAdmin) {
      alert('Administrator access required to view Recruiter Intelligence Hub.');
      return;
    }
    setActiveTab('recruiter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      
      {/* Sticky Responsive Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'recruiter' && !isAdmin) {
            alert('Administrator access required to view Recruiter Hub.');
            return;
          }
          setActiveTab(tab);
        }}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        
        {/* Landing / Welcome Home */}
        {activeTab === 'landing' && (
          <LandingPage
            onStartSetup={handleStartSetup}
            onOpenRecruiter={handleOpenRecruiter}
            onNavigateSignIn={() => setActiveTab('signin')}
            onNavigateSignUp={() => setActiveTab('signup')}
            onNavigateDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* Features View (Scrolls or presents landing features) */}
        {activeTab === 'features' && (
          <LandingPage
            onStartSetup={handleStartSetup}
            onOpenRecruiter={handleOpenRecruiter}
            onNavigateSignIn={() => setActiveTab('signin')}
            onNavigateSignUp={() => setActiveTab('signup')}
            onNavigateDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* Authentication: Sign In */}
        {activeTab === 'signin' && (
          <SignInPage
            onNavigateSignUp={() => setActiveTab('signup')}
            onSuccess={() => setActiveTab('dashboard')}
          />
        )}

        {/* Authentication: Create Account */}
        {activeTab === 'signup' && (
          <SignUpPage
            onNavigateSignIn={() => setActiveTab('signin')}
            onSuccess={() => setActiveTab('dashboard')}
          />
        )}

        {/* Profile & User ID Management */}
        {activeTab === 'profile' && (
          <ProfilePage
            onStartInterview={() => handleStartSetup()}
            onViewResume={() => setActiveTab('my-resume')}
            onViewHistory={() => setActiveTab('history')}
            onViewAnalytics={() => setActiveTab('analytics')}
            onOpenRecruiter={isAdmin ? () => setActiveTab('recruiter') : undefined}
          />
        )}

        {/* Candidate Resume Record */}
        {activeTab === 'my-resume' && (
          <MyResumePage
            onStartInterviewWithResume={() => handleStartSetup()}
          />
        )}

        {/* Candidate Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            onStartNew={() => handleStartSetup()}
            onViewReport={handleViewReport}
            onResumeInterview={handleResumeInterview}
          />
        )}

        {/* Skill Gap Analysis & Career Growth Module */}
        {(activeTab === 'skill-gap' || activeTab === 'analytics') && (
          <SkillGapPage
            onStartInterviewWithCompetency={() => {
              handleStartSetup();
            }}
          />
        )}

        {/* Start Interview Setup */}
        {activeTab === 'setup' && (
          <SetupPage
            initialPreset={selectedPreset}
            onInterviewCreated={handleInterviewCreated}
          />
        )}

        {/* Live Proctored Interview Room */}
        {activeTab === 'interview' && activeSessionId && (
          <InterviewRoomPage
            sessionId={activeSessionId}
            onFinishInterview={handleFinishInterview}
          />
        )}

        {/* Final Evaluation Report */}
        {activeTab === 'report' && activeSessionId && (
          <ReportPage
            sessionId={activeSessionId}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* Admin Recruiter Intelligence Hub */}
        {activeTab === 'recruiter' && isAdmin && (
          <RecruiterPage onViewReport={handleViewReport} />
        )}

        {/* Interview History */}
        {activeTab === 'history' && (
          <HistoryPage
            onViewReport={handleViewReport}
            onResumeInterview={handleResumeInterview}
          />
        )}

      </main>

      {/* Professional SaaS Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#080B16]/80 backdrop-blur-md py-8 text-xs text-slate-500 dark:text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ProofHire AI
            </span>
            <span className="text-slate-400">
              • Google Student Club Hackathon 2026 Edition
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            <span>Google Gemini 1.5 Flash</span>
            <span>•</span>
            <span>FastAPI JWT Auth</span>
            <span>•</span>
            <span>SQLite & React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
