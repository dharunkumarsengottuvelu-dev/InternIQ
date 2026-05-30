import { motion } from 'framer-motion';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-950 dark:bg-[#080d1a]">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6"
    >
      {/* Animated logo mark */}
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-brand opacity-20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-brand flex items-center justify-center">
          <span className="text-white font-black text-2xl">IQ</span>
        </div>
      </div>

      {/* Spinner dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-brand-500"
            animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>

      <p className="text-surface-muted text-sm font-medium">Loading InternIQ...</p>
    </motion.div>
  </div>
);

export default PageLoader;
