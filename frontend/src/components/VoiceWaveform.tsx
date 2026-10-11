import React from 'react';

interface VoiceWaveformProps {
  isActive: boolean;
  label?: string;
  color?: 'violet' | 'emerald' | 'amber' | 'blue';
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isActive,
  label,
  color = 'violet'
}) => {
  const getBarColor = () => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'blue':
        return 'bg-blue-600';
      default:
        return 'bg-violet-600';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end justify-center gap-1 h-7 px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
        {[0.3, 0.7, 0.4, 0.9, 0.5, 0.2, 0.8].map((delay, idx) => (
          <div
            key={idx}
            className={`w-1 rounded-full ${getBarColor()} transition-all ${
              isActive ? 'animate-wave-bar' : 'h-1.5 opacity-30'
            }`}
            style={{
              animationDelay: isActive ? `${delay}s` : '0s'
            }}
          />
        ))}
      </div>
      {label && (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {label}
        </span>
      )}
    </div>
  );
};

export default VoiceWaveform;
