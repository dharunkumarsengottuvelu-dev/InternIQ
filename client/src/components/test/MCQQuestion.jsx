import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Badge } from '@/components/ui/index.jsx';
import { cn } from '@/lib/utils';
import useTestStore from '@/store/testStore';

const MCQQuestion = ({ question, index }) => {
  const { answers, setAnswer } = useTestStore();
  const selectedOption = answers[question.id];

  const handleSelect = (optionKey) => {
    setAnswer(question.id, optionKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Question {index + 1}</h3>
        <Badge variant="outline">{question.skill}</Badge>
      </div>

      <div className="text-lg text-zinc-300 mb-6 leading-relaxed">
        {question.question}
      </div>

      {question.codeSnippet && (
        <div className="mb-6 p-4 rounded-md bg-zinc-950 border border-zinc-800 overflow-x-auto">
          <pre className="text-sm font-mono text-zinc-300">
            <code>{question.codeSnippet}</code>
          </pre>
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(question.options).map(([key, value]) => {
          const isSelected = selectedOption === key;

          return (
            <div
              key={key}
              onClick={() => handleSelect(key)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group select-none",
                isSelected
                  ? "border-emerald-500 bg-emerald-500/15 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                  : "border-zinc-700 bg-zinc-900/50 hover:border-emerald-500/50 hover:bg-zinc-800/70"
              )}
            >
              {/* Option letter badge */}
              <div
                className={cn(
                  "w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200",
                  isSelected
                    ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : "border-zinc-600 text-zinc-400 group-hover:border-emerald-500/60 group-hover:text-emerald-400"
                )}
              >
                {isSelected ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : key}
              </div>

              {/* Option text */}
              <div className={cn(
                "flex-1 text-base leading-snug",
                isSelected ? "text-emerald-100 font-semibold" : "text-zinc-300 group-hover:text-white"
              )}>
                {value}
              </div>

              {/* Selected indicator pulse dot */}
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MCQQuestion;
