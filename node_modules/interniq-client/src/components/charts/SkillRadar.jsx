import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const SkillRadar = ({ skills = [] }) => {
  const data = skills.slice(0, 8).map(skill => ({
    skill: skill.name || skill,
    score: skill.score ?? Math.floor(Math.random() * 40 + 60), // placeholder
  }));

  if (data.length < 3) {
    return (
      <div className="h-52 flex items-center justify-center text-surface-muted text-sm">
        Upload your resume to see skill analysis
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }}
        />
        <Radar
          name="Skills"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
          animationDuration={1200}
        />
        <Tooltip
          contentStyle={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            fontSize: '12px',
            fontFamily: 'Inter',
            color: '#f1f5f9',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default SkillRadar;
