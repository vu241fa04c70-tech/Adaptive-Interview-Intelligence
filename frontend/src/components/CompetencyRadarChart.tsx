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
  theme?: 'light' | 'dark';
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({
  competencies,
  theme = 'light'
}) => {
  const isDark = theme === 'dark' || document.documentElement.classList.contains('dark');

  const data = Object.values(competencies).map((item) => {
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
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm font-medium">
        No competency evaluation data recorded yet.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid
            stroke={isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.8)'}
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: isDark ? '#A5AEC5' : '#334155',
              fontSize: 11,
              fontWeight: 600
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 4]}
            tick={{
              fill: isDark ? '#77819B' : '#64748B',
              fontSize: 10
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const pData = payload[0].payload;
                return (
                  <div className="card-theme p-3 text-xs shadow-lg space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">{pData.fullName}</p>
                    <p className="text-violet-600 dark:text-violet-400 font-bold">
                      Score: {pData.score} / 4.0 ({pData.percentage}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Radar
            name="Candidate Competency"
            dataKey="score"
            stroke="#7C3AED"
            fill="#7C3AED"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompetencyRadarChart;
