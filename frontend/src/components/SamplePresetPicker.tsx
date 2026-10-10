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
      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
        <Zap className="w-4 h-4 text-amber-400 animate-spin" /> Loading quick setup presets...
      </div>
    );
  }

  if (!presets.length) return null;

  return (
    <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            1-Click Candidate Presets (Instant Demo Setup)
          </h4>
        </div>
        <span className="text-[11px] text-indigo-300 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          Fast Demo Mode
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {presets.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectPreset(p)}
            className="group bg-slate-950/70 border border-slate-800 hover:border-indigo-500/60 rounded-xl p-3.5 cursor-pointer transition-all hover:bg-slate-900 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  {p.candidate_name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                  {p.target_difficulty}
                </span>
              </div>
              <p className="text-xs text-indigo-300 font-medium flex items-center gap-1 mb-2">
                <Briefcase className="w-3 h-3 text-indigo-400" />
                {p.role}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.parsed_skills.slice(0, 4).map((s, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              <span>Load Preset</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SamplePresetPicker;
