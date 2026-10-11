import React, { useState } from 'react';
import {
  Settings,
  X,
  Check,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Cpu,
  Lock,
  Volume2,
  ShieldAlert,
  Server
} from 'lucide-react';
import { verifyApiKey } from '../services/api';
import type { SystemStatusResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  onClose: () => void;
  systemStatus: SystemStatusResponse | null;
  onStatusUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  systemStatus,
  onStatusUpdated
}) => {
  const { isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<'ai' | 'proctor' | 'audio'>('ai');
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdminKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await verifyApiKey(adminKeyInput.trim());
      if (res.success) {
        setMessage(res.message);
        setAdminKeyInput('');
        onStatusUpdated();
      } else {
        setError(res.message || 'Failed to verify API key with backend.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify and save API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1224] border border-slate-200 dark:border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Platform Settings & Administration
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage AI intelligence backend, proctoring security, and interaction preferences
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-2">
          {[
            { id: 'ai', label: 'AI Service & Model', icon: Cpu },
            { id: 'proctor', label: 'Proctoring Rules', icon: ShieldAlert },
            { id: 'audio', label: 'Speech & Audio', icon: Volume2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: AI SERVICE CONFIGURATION */}
        {activeSection === 'ai' && (
          <div className="space-y-4">
            {/* Live Backend Connection Status Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-600" />
                  Backend AI Provider Status
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                    systemStatus?.ai_connected
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      systemStatus?.ai_connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {systemStatus?.ai_connected ? 'AI Connected' : 'AI Unavailable'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block font-medium">Model Deployment</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {systemStatus?.model || 'gemini-3.8-flash'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block font-medium">Engine Mode</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {systemStatus?.ai_connected ? 'Live Gemini LLM' : 'Adaptive Fallback Engine'}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Architecture Notice */}
            <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white">Secure Server-Side Configuration:</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  The Google Gemini API key is loaded strictly on the backend from the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono font-semibold">GEMINI_API_KEY</code> environment variable (<code className="font-mono">backend/.env</code>). Credentials are never exposed to the browser or frontend source code.
                </p>
              </div>
            </div>

            {/* Admin Override Form */}
            {isAdmin ? (
              <form onSubmit={handleAdminKeySubmit} className="space-y-3 pt-1 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                    Admin Runtime Key Override:
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/20">
                    Admin Verified
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    placeholder="Enter new GEMINI_API_KEY to test & apply..."
                    className="input-theme pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {message && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {message}
                  </div>
                )}

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !adminKeyInput.trim()}
                  className="btn-primary w-full py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {loading ? 'Verifying AI Connection...' : 'Apply & Verify AI Backend'}
                </button>
              </form>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                  <Lock className="w-3.5 h-3.5 text-purple-500" />
                  <span>Administrative Protected Section</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Only authorized platform administrators (<code className="font-mono">role: admin</code>) can update AI provider keys, change model parameters, or reconfigure proctoring policies. Candidate accounts have read-only visibility into service health.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: PROCTORING SECURITY RULES */}
        {activeSection === 'proctor' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Active Integrity Policies
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <li>• <strong>Mobile Phone Detection:</strong> Real-time frame analysis catches unauthorized devices.</li>
                <li>• <strong>Multiple Persons Filter:</strong> Flags secondary individuals in the camera stream.</li>
                <li>• <strong>Tab Switch Tracking:</strong> Listens to browser tab visibility changes and window blur events.</li>
                <li>• <strong>Strict 3-Warning Threshold:</strong> Exceeding 3 warnings automatically locks the session.</li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Integrity telemetry events are securely transmitted and logged to the Recruiter Analytics Hub.
            </p>
          </div>
        )}

        {/* SECTION 3: SPEECH & AUDIO */}
        {activeSection === 'audio' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                Speech Interaction Implementation
              </span>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                ProofHire AI uses browser-native <strong>Web Speech API</strong> (SpeechSynthesis for question readout and SpeechRecognition for spoken candidate reasoning).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-700 dark:text-violet-300">
              Voice mode can be enabled or toggled at any time during the interview using the microphone button.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-5 py-2 text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
