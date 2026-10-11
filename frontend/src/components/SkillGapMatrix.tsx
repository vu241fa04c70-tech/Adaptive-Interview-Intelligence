import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import type { SkillGapItem } from '../types';

interface SkillGapMatrixProps {
  matrix: SkillGapItem[];
}

export const SkillGapMatrix: React.FC<SkillGapMatrixProps> = ({ matrix }) => {
  if (!matrix || matrix.length === 0) {
    return <div className="text-slate-500 text-sm py-4">No skill gap data available.</div>;
  }

  const getStatusBadge = (status: string, score: number) => {
    switch (status) {
      case 'demonstrated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Demonstrated ({score.toFixed(1)}/4.0)
          </span>
        );
      case 'partially_demonstrated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Partially Tested ({score.toFixed(1)}/4.0)
          </span>
        );
      case 'not_demonstrated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Not Demonstrated ({score.toFixed(1)}/4.0)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Not Assessed
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
            <th className="py-3.5 px-4">Competency / Skill</th>
            <th className="py-3.5 px-3 text-center">In Resume</th>
            <th className="py-3.5 px-3 text-center">Required by JD</th>
            <th className="py-3.5 px-4">Evidence Status</th>
            <th className="py-3.5 px-4">Findings & Quote Evidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-slate-900 dark:text-white">
          {matrix.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
              <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                {item.competency}
              </td>
              <td className="py-3.5 px-3 text-center">
                {item.claimed_in_resume ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="py-3.5 px-3 text-center">
                {item.required_by_job ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="py-3.5 px-4">
                {getStatusBadge(item.status, item.demonstrated_score)}
              </td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium max-w-xs truncate">
                {item.evidence_summary || 'No direct evidence quotes recorded for this competency.'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkillGapMatrix;
