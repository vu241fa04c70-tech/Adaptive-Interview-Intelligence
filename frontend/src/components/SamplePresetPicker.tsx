import React, { useState, useEffect } from 'react';
import { Sparkles, User, Briefcase, ChevronRight, Zap } from 'lucide-react';
import { getPresets } from '../services/api';
import type { PresetCandidate } from '../types';

interface SamplePresetPickerProps {
  onSelectPreset: (preset: PresetCandidate) => void;
}

export const SamplePresetPicker: React.FC<SamplePresetPickerProps> = ({ onSelectPreset }) => {
  const [presets, setPresets] = useState<PresetCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPresets()
      .then((data) => {
        setPresets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-4 font-medium">
        <Zap className="w-4 h-4 text-amber-500 animate-spin" /> Loading quick setup profiles...
      </div>
    );
  }

  if (!presets.length) return null;

  return (
    <div className="card-theme p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Instant 1-Click Candidate Profiles
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test adaptive questioning instantly without uploading your own resume
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 dark:bg-violet-500/20 px-3 py-1 rounded-full border border-violet-500/20">
          Ready for Hackathon Demo
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {presets.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectPreset(p)}
            className="group card-theme-interactive p-4 cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-violet-400 transition-colors flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600 dark:text-violet-400 shrink-0" />
                  {p.candidate_name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 capitalize border border-slate-200 dark:border-white/10">
                  {p.target_difficulty}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5 mb-2.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {p.role}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {p.parsed_skills.slice(0, 4).map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-white/10 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-bold text-blue-600 dark:text-violet-400 group-hover:translate-x-0.5 transition-transform">
              <span>Select & Practice</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SamplePresetPicker;
