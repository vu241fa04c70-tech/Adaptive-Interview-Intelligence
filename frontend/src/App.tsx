import { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SetupPage from './pages/SetupPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import ReportPage from './pages/ReportPage';
import RecruiterPage from './pages/RecruiterPage';
import HistoryPage from './pages/HistoryPage';
import type { PresetCandidate } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetCandidate | null>(null);

  const handleStartSetup = (preset?: PresetCandidate) => {
    setSelectedPreset(preset || null);
    setActiveTab('setup');
  };

  const handleInterviewCreated = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('interview');
  };

  const handleFinishInterview = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('report');
  };

  const handleViewReport = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('report');
  };

  const handleResumeInterview = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('interview');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 pb-16">
        {activeTab === 'landing' && (
          <LandingPage
            onStartSetup={handleStartSetup}
            onOpenRecruiter={() => setActiveTab('recruiter')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            onStartNew={() => handleStartSetup()}
            onViewReport={handleViewReport}
            onResumeInterview={handleResumeInterview}
          />
        )}

        {activeTab === 'setup' && (
          <SetupPage
            initialPreset={selectedPreset}
            onInterviewCreated={handleInterviewCreated}
          />
        )}

        {activeTab === 'interview' && activeSessionId && (
          <InterviewRoomPage
            sessionId={activeSessionId}
            onFinishInterview={handleFinishInterview}
          />
        )}

        {activeTab === 'report' && activeSessionId && (
          <ReportPage
            sessionId={activeSessionId}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'recruiter' && (
          <RecruiterPage onViewReport={handleViewReport} />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            onViewReport={handleViewReport}
            onResumeInterview={handleResumeInterview}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 ProofHire AI — Google Student Club Welcome Hackathon Edition</p>
          <p className="text-slate-400 font-medium">Built with Gemini API, FastAPI & React</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
