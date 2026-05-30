import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getScoreHex } from '@/lib/utils';
import { motion } from 'framer-motion';

const ScoreDonut = ({ atsScore, mcqScore, codingScore, overallScore }) => {
  const scores = [
    { name: 'ATS Resume',    value: atsScore    ?? 0, weight: 30, color: '#6366f1' },
    { name: 'MCQ Test',      value: mcqScore    ?? 0, weight: 30, color: '#8b5cf6' },
    { name: 'Coding Test',   value: codingScore ?? 0, weight: 40, color: '#06b6d4' },
  ];

  const hasData = scores.some(s => s.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, weight } = payload[0].payload;
    return (
      <div className="bg-surface-900 border border-surface-border rounded-xl px-4 py-2.5 shadow-card-dark text-sm">
        <p className="font-semibold dark:text-white">{name}</p>
        <p className="text-surface-muted">Score: <span className="text-white font-bold">{value}</span>/100</p>
        <p className="text-surface-muted">Weight: {weight}%</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? scores : [{ name: 'No data', value: 1, color: '#1e293b' }]}
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={72}
              paddingAngle={hasData ? 3 : 0}
              dataKey="value"
              animationBegin={200}
              animationDuration={1200}
            >
              {(hasData ? scores : [{ color: '#1e293b' }]).map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            {hasData && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        </ResponsiveContainer>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={overallScore}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-black dark:text-white"
            style={{ color: getScoreHex(overallScore) }}
          >
            {overallScore ?? '–'}
          </motion.span>
          <span className="text-xs text-surface-muted">Overall</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full max-w-[200px]">
        {scores.map(({ name, value, color, weight }) => (
          <div key={name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span className="text-surface-muted">{name}</span>
            </div>
            <span className="font-semibold dark:text-white">{value > 0 ? value : '–'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreDonut;
