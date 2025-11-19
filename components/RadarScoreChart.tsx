import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ViralMetrics } from '../types';

interface Props {
  scores: ViralMetrics;
}

export const RadarScoreChart: React.FC<Props> = ({ scores }) => {
  const data = [
    { subject: 'Retenção', A: scores.watchTime, fullMark: 5 },
    { subject: 'Viralização', A: scores.shareability, fullMark: 5 },
    { subject: 'Valor', A: scores.saveability, fullMark: 5 },
    { subject: 'Debate', A: scores.commentVelocity, fullMark: 5 },
  ];

  return (
    <div className="h-full w-full flex items-center justify-center relative z-10">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
          <Radar
            name="Viral Score"
            dataKey="A"
            stroke="#c084fc"
            strokeWidth={3}
            fill="#c084fc"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};