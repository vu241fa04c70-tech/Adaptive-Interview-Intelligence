import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, FileText, Briefcase } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Demonstrated ({score.toFixed(1)}/4.0)
          </span>
        );
      case 'partially_demonstrated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Partially Tested ({score.toFixed(1)}/4.0)
          </span>
        );
      case 'not_demonstrated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Not Demonstrated ({score.toFixed(1)}/4.0)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Not Assessed
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Competency / Skill</th>
            <th className="py-3 px-3 text-center">Resume Claim</th>
            <th className="py-3 px-3 text-center">JD Required</th>
            <th className="py-3 px-4">Interview Evidence Status</th>
            <th className="py-3 px-4">Evidence & Findings</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-200">
          {matrix.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
              <td className="py-3.5 px-4 font-semibold text-white">
                {item.competency}
              </td>
              <td className="py-3.5 px-3 text-center">
                {item.claimed_in_resume ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-medium">
                    <FileText className="w-3 h-3" /> Yes
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">-</span>
                )}
              </td>
              <td className="py-3.5 px-3 text-center">
                {item.required_by_job ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[11px] font-medium">
                    <Briefcase className="w-3 h-3" /> Required
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">-</span>
                )}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                {getStatusBadge(item.status, item.demonstrated_score)}
              </td>
              <td className="py-3.5 px-4 text-slate-300">
                {item.evidence_summary}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkillGapMatrix;
