import { Sparkles, Mic, Volume2, Cpu } from 'lucide-react';

export type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

interface AiInterviewerAvatarProps {
  state: AvatarState;
  isAudioPlaying?: boolean;
  voiceMode?: boolean;
}

export const AiInterviewerAvatar: React.FC<AiInterviewerAvatarProps> = ({
  state,
  isAudioPlaying = false,
  voiceMode = false
}) => {
  // Determine ring animation & status styling
  const getRingColor = () => {
    switch (state) {
      case 'speaking':
        return 'border-violet-500 shadow-violet-500/40 ring-violet-500/20';
      case 'listening':
        return 'border-emerald-500 shadow-emerald-500/40 ring-emerald-500/20';
      case 'thinking':
        return 'border-amber-500 shadow-amber-500/40 ring-amber-500/20';
      default:
        return 'border-blue-500/40 shadow-blue-500/20 ring-blue-500/10';
    }
  };

  const getStatusBadge = () => {
    switch (state) {
      case 'speaking':
        return {
          text: 'AI Interviewer Speaking...',
          bg: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
          dot: 'bg-violet-500 animate-pulse',
          icon: Volume2
        };
      case 'listening':
        return {
          text: 'Listening to your response...',
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-500 animate-ping',
          icon: Mic
        };
      case 'thinking':
        return {
          text: 'Analyzing reasoning depth...',
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          dot: 'bg-amber-500 animate-bounce',
          icon: Cpu
        };
      default:
        return {
          text: 'Interviewer Ready',
          bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
          dot: 'bg-blue-500',
          icon: Sparkles
        };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      {/* Avatar Container with Animated Waves */}
      <div className="relative flex items-center justify-center">
        {/* Outer ambient wave rings */}
        {state === 'speaking' && (
          <>
            <div className="absolute w-36 h-36 rounded-full border-2 border-violet-500/30 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full border border-violet-400/20 animate-pulse pointer-events-none" />
          </>
        )}

        {state === 'listening' && (
          <>
            <div className="absolute w-36 h-36 rounded-full border-2 border-emerald-500/40 animate-ping opacity-75 pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full border border-emerald-400/20 animate-pulse pointer-events-none" />
          </>
        )}

        {state === 'thinking' && (
          <div className="absolute w-36 h-36 rounded-full border-2 border-dashed border-amber-500/60 animate-spin pointer-events-none" />
        )}

        {/* Core Avatar Circle */}
        <div
          className={`relative w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-2 ${getRingColor()} shadow-xl transition-all duration-300 ring-8`}
        >
          {/* Subtle neural network grid graphic */}
          <div className="absolute inset-0 rounded-full opacity-30 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:10px_10px]" />

          {/* Avatar Face Graphic */}
          <div className="relative flex flex-col items-center justify-center text-center z-10">
            {/* Holographic Head Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 text-white">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            {/* Speaking audio wave bars below icon */}
            {(state === 'speaking' || isAudioPlaying) ? (
              <div className="flex items-center gap-1 mt-2 h-4">
                {[0.2, 0.5, 0.3, 0.8, 0.4].map((delay, i) => (
                  <span
                    key={i}
                    className="w-1 bg-violet-400 rounded-full animate-wave-bar"
                    style={{ animationDelay: `${delay}s`, height: '14px' }}
                  />
                ))}
              </div>
            ) : state === 'listening' ? (
              <div className="flex items-center gap-1 mt-2 h-4">
                {[0.1, 0.4, 0.6, 0.3].map((delay, i) => (
                  <span
                    key={i}
                    className="w-1 bg-emerald-400 rounded-full animate-wave-bar"
                    style={{ animationDelay: `${delay}s`, height: '12px' }}
                  />
                ))}
              </div>
            ) : state === 'thinking' ? (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            ) : (
              <span className="text-[10px] font-semibold text-slate-300 mt-1.5 tracking-wide">
                ProofHire AI
              </span>
            )}
          </div>

          {/* Micro status badge on the bottom-right corner */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md">
            <StatusIcon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          </div>
        </div>
      </div>

      {/* State Text & Mode Indicator */}
      <div className="text-center space-y-1">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.bg} transition-all`}>
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span>{status.text}</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {voiceMode ? 'Voice Mode Active • Hands-Free' : 'Text & Voice Hybrid Mode'}
        </p>
      </div>
    </div>
  );
};

export default AiInterviewerAvatar;
