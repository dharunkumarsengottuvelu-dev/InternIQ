import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import useTestStore from '@/store/testStore';

const Timer = ({ duration, onExpire }) => {
  const { timeRemaining, setTimeRemaining } = useTestStore();

  useEffect(() => {
    // Initialize timer if not already set
    if (timeRemaining === null) {
      setTimeRemaining(duration);
    }
  }, [duration, timeRemaining, setTimeRemaining]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) {
      if (timeRemaining === 0) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, setTimeRemaining, onExpire]);

  if (timeRemaining === null) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const isLowTime = timeRemaining < 300; // less than 5 mins

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm font-mono text-lg font-medium",
        isLowTime ? "text-red-500 border-red-500/50 animate-pulse" : "text-foreground border-border"
      )}
    >
      <Clock size={20} className={cn(isLowTime && "animate-spin-slow")} />
      <span>{String(minutes).padStart(2, '0')}</span>
      <span>:</span>
      <span>{String(seconds).padStart(2, '0')}</span>
    </motion.div>
  );
};

export default Timer;
