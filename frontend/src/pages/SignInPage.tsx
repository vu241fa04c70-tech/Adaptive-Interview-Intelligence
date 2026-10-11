import React, { useState, useEffect } from 'react';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  UserCheck,
  ArrowLeft,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendPasswordResetOtp, verifyPasswordResetOtp } from '../services/api';

interface SignInPageProps {
  onNavigateSignUp: () => void;
  onSuccess: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onNavigateSignUp,
  onSuccess
}) => {
  const { login, googleSignIn } = useAuth();

  // Primary Sign In States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google Modal States
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Forgot Password / Email OTP States
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1); // 1: Email, 2: OTP + New Password
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  // Resend Countdown Timer effect
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Trigger
  const handleOpenGoogleModal = () => {
    setGoogleError(null);
    setIsGoogleModalOpen(true);
  };

  const handleExecuteGoogleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGoogleError(null);

    const targetEmail = googleEmail.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setGoogleError('Please enter a valid Google / Gmail address.');
      return;
    }

    setGoogleLoading(true);
    try {
      const derivedName = googleName.trim() || targetEmail.split('@')[0].replace(/[._]/g, ' ');
      await googleSignIn(undefined, targetEmail, derivedName);
      setIsGoogleModalOpen(false);
      onSuccess();
    } catch (err: any) {
      setGoogleError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Quick Demo Logins for evaluators
  const handleDemoAdmin = () => {
    setEmail('admin@proofhire.ai');
    setPassword('Admin@ProofHire2026!');
    setErrorMessage(null);
  };

  const handleDemoCandidate = () => {
    setEmail('jane.dev@example.com');
    setPassword('Password123!');
    setErrorMessage(null);
  };

  // Step 1: Send OTP to Candidate's Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const targetEmail = resetEmail.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setResetError('Please enter a valid registered email address.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await sendPasswordResetOtp(targetEmail);
      setResetStep(2);
      setResendCountdown(60);
      setMaskedEmail(res.masked_email || null);
      setResetSuccess(res.message || 'Verification code sent to your email address. Please check your inbox and spam folder.');
    } catch (err: any) {
      setResetError(err.message || 'Failed to dispatch verification code. Please check your email.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const code = resetOtp.trim().replace(/\s+/g, '');
    if (code.length !== 6) {
      setResetError('Please enter the full 6-digit verification code.');
      return;
    }

    if (resetNewPass.length < 8) {
      setResetError('New password must be at least 8 characters long.');
      return;
    }

    if (resetNewPass !== resetConfirmPass) {
      setResetError('Passwords do not match. Please re-check.');
      return;
    }

    setResetLoading(true);
    try {
      await verifyPasswordResetOtp(resetEmail.trim(), code, resetNewPass);
      setResetSuccess('Password reset successfully! Logging you in...');
      setTimeout(() => {
        setIsResetOpen(false);
        onSuccess();
      }, 1000);
    } catch (err: any) {
      setResetError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 mb-2 shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sign In to ProofHire AI
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Welcome back! Access your adaptive interview workspace & progress reports.
          </p>
        </div>

        {/* Card Container */}
        <div className="card-theme p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-6">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="input-theme pl-10 w-full text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetOpen(true);
                    setResetStep(1);
                    setResetEmail(email || '');
                    setResetError(null);
                    setResetSuccess(null);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-theme pl-10 pr-10 w-full text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 btn-primary flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200 dark:border-white/10" />
            <span className="shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Or
            </span>
            <div className="grow border-t border-slate-200 dark:border-white/10" />
          </div>

          {/* Continue with Real Google Account */}
          <button
            type="button"
            onClick={handleOpenGoogleModal}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-xs"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Demo Credentials for Reviewers */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
              Quick 1-Click Demo Profiles
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDemoCandidate}
                className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Candidate Demo</span>
              </button>

              <button
                type="button"
                onClick={handleDemoAdmin}
                className="px-2.5 py-2 text-xs rounded-lg border border-purple-300 dark:border-purple-800/80 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-500" />
                <span>Admin Demo</span>
              </button>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={onNavigateSignUp}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* Real Google Account Sign-In Modal */}
      {/* ========================================================= */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Continue with Google Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Authenticate using your real Google identity. Your profile, interview history, and evaluation records will be permanently tied to your Gmail address.
            </p>

            {googleError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{googleError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteGoogleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Real Gmail / Google Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="input-theme pl-10 w-full text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Kanchana"
                  className="input-theme w-full text-sm"
                />
              </div>

              {/* Quick Preset Buttons for Convenience */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Examples / Pre-fill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleEmail('kanchana.hire@gmail.com');
                      setGoogleName('Kanchana');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/10 hover:text-blue-500 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    kanchana.hire@gmail.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleEmail('candidate.proofhire@gmail.com');
                      setGoogleName('Candidate User');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/10 hover:text-blue-500 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    candidate.proofhire@gmail.com
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {googleLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Google</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2-Step Real Email OTP Password Reset Modal */}
      {/* ========================================================= */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Reset Password with Email OTP
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Step {resetStep} of 2: {resetStep === 1 ? 'Dispatch Verification Code' : 'Verify & Set Password'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Feedback */}
            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span>{resetSuccess}</span>
                </div>
              </div>
            )}

            {/* Step 1: Input Email */}
            {resetStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your registered email address. We will send a secure 6-digit one-time password (OTP) verification code to your real email inbox.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. jane.dev@example.com"
                      className="input-theme pl-10 w-full text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Input OTP Code & New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Sent to: <strong className="text-slate-900 dark:text-white">{maskedEmail || resetEmail}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setResetError(null);
                      setResetSuccess(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Change Email
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    6-Digit Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="input-theme w-full text-center tracking-[0.4em] font-mono text-lg font-bold py-2.5"
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500">Valid for 10 minutes</span>
                    <button
                      type="button"
                      disabled={resendCountdown > 0 || resetLoading}
                      onClick={() => handleSendOtp()}
                      className="text-blue-600 dark:text-blue-400 hover:underline disabled:text-slate-400 disabled:no-underline font-medium"
                    >
                      {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    New Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showResetPass ? 'text' : 'password'}
                      required
                      value={resetNewPass}
                      onChange={(e) => setResetNewPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-theme pl-10 pr-10 w-full text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPass(!showResetPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showResetPass ? 'text' : 'password'}
                      required
                      value={resetConfirmPass}
                      onChange={(e) => setResetConfirmPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-theme pl-10 pr-10 w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Reset Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
