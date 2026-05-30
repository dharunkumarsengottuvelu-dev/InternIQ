import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Lightbulb, Target, Eye } from 'lucide-react';
import { Card, CardBody, Badge } from '@/components/ui/index.jsx';
import { getScoreColor, getScoreHex, getScoreLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

const ScoreRing = ({ score, size = 120 }) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = score != null ? (score / 100) * circumference : 0;
  const color = getScoreHex(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black dark:text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{ color }}
        >
          {score ?? '–'}
        </motion.span>
        <span className="text-[10px] text-surface-muted font-medium">/ 100</span>
      </div>
    </div>
  );
};

const BreakdownBar = ({ label, score, max = 20, feedback, delay = 0 }) => {
  const pct = (score / max) * 100;
  const color = pct >= 75 ? 'bg-success-500' : pct >= 50 ? 'bg-warning-500' : 'bg-danger-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium dark:text-white capitalize">{label}</span>
        <span className={cn('text-sm font-bold', pct >= 75 ? 'text-success-500' : pct >= 50 ? 'text-warning-500' : 'text-danger-500')}>
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-surface-700/50 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: delay + 0.2 }}
        />
      </div>
      {feedback && <p className="text-xs text-surface-muted leading-relaxed">{feedback}</p>}
    </motion.div>
  );
};

const ATSScoreCard = ({ atsReport, atsScore }) => {
  if (!atsReport) return null;

  const { breakdown = {}, strengths = [], weaknesses = [], suggestedImprovements = [], missingKeywords = [], industryFit = [] } = atsReport;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Overall score header */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing score={atsScore} size={130} />
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h2 className="text-2xl font-black dark:text-white">ATS Score</h2>
              <p className={cn('text-lg font-bold', getScoreColor(atsScore))}>
                {getScoreLabel(atsScore)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Badge variant="brand">
                <Eye className="w-3 h-3" /> Readability: {atsReport.readabilityScore}/100
              </Badge>
              {industryFit.slice(0, 2).map((fit) => (
                <Badge key={fit} variant="neutral">{fit}</Badge>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Score breakdown */}
      <Card>
        <CardBody className="space-y-5">
          <h3 className="font-bold dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-400" /> Score Breakdown
          </h3>
          {Object.entries(breakdown).map(([key, { score, feedback }], i) => (
            <BreakdownBar
              key={key} label={key} score={score} max={20}
              feedback={feedback} delay={i * 0.1}
            />
          ))}
        </CardBody>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-bold text-success-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Strengths
            </h3>
            <ul className="space-y-2">
              {strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-surface-muted">
                  <TrendingUp className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-bold text-danger-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Weaknesses
            </h3>
            <ul className="space-y-2">
              {weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm text-surface-muted">
                  <TrendingDown className="w-3.5 h-3.5 text-danger-500 flex-shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Suggestions */}
      <Card>
        <CardBody className="space-y-4">
          <h3 className="font-bold dark:text-white flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-warning-500" /> Suggested Improvements
          </h3>
          <div className="space-y-2">
            {suggestedImprovements.map((s, i) => (
              <div key={i} className="flex gap-3 text-sm text-surface-muted">
                <span className="text-brand-400 font-bold flex-shrink-0">{i + 1}.</span>
                {s}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Missing keywords */}
      {missingKeywords.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-bold dark:text-white text-sm">Missing Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((kw) => (
                <Badge key={kw} variant="warning">{kw}</Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </motion.div>
  );
};

export default ATSScoreCard;
