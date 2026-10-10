import React from 'react';

interface VoiceWaveformProps {
  isActive: boolean;
  label?: string;
  color?: 'indigo' | 'emerald' | 'amber';
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isActive,
  label,
  color = 'indigo'
}) => {
  const barColor =
    color === 'emerald'
      ? 'bg-emerald-400'
      : color === 'amber'
      ? 'bg-amber-400'
      : 'bg-indigo-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end justify-center gap-1 h-7 px-2 py-1 bg-slate-950/60 rounded-lg border border-slate-800">
        {[0.4, 0.8, 0.5, 0.9, 0.6, 0.3, 0.7].map((delay, idx) => (
          <div
            key={idx}
            className={`w-1 rounded-full ${barColor} transition-all ${
              isActive ? 'animate-wave-bar' : 'h-1.5 opacity-40'
            }`}
            style={{
              animationDelay: isActive ? `${delay}s` : '0s'
            }}
          />
        ))}
      </div>
      {label && (
        <span className="text-xs font-semibold text-slate-300">
          {label}
        </span>
      )}
    </div>
  );
};

export default VoiceWaveform;
