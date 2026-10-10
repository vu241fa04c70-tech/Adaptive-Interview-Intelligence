import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import type { CompetencyStatus } from '../types';

interface CompetencyRadarChartProps {
  competencies: Record<string, CompetencyStatus>;
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({ competencies }) => {
  const data = Object.values(competencies).map((item) => {
    // Shorten name if needed for chart label
    const shortName = item.name.length > 20 ? item.name.substring(0, 18) + '...' : item.name;
    const scoreVal = roundScore(item.score);
    return {
      subject: shortName,
      fullName: item.name,
      score: scoreVal,
      percentage: Math.round((scoreVal / 4.0) * 100),
      fullMark: 4
    };
  });

  function roundScore(val: number) {
    return Math.round((val || 0) * 10) / 10;
  }

  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No competency data available yet.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const pData = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                    <p className="font-bold text-white mb-1">{pData.fullName}</p>
                    <p className="text-indigo-400 font-semibold">
                      Score: {pData.score} / 4.0 ({pData.percentage}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Radar
            name="Candidate"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompetencyRadarChart;
