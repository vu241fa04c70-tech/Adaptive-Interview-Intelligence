import React, { useState } from 'react';
import { Key, X, Check, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { verifyApiKey } from '../services/api';

interface ApiKeyModalProps {
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onKeyUpdated }) => {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await verifyApiKey(keyInput.trim());
      if (res.success) {
        setMessage(res.message);
        onKeyUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Google Gemini API Configuration</h3>
            <p className="text-xs text-slate-400">Configure your Gemini API Key for live AI model inference</p>
          </div>
        </div>

        <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3.5 mb-5 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-indigo-300">Server-Side Security:</span>
            <p className="text-slate-400 mt-0.5">
              API keys are transmitted securely to the server process and are never saved in local storage or client browser caches.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gemini API Key (GEMINI_API_KEY)
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !keyInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save & Activate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
