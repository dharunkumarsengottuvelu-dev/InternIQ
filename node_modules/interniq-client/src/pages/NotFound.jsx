import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Zap } from 'lucide-react';
import { Button } from '@/components/ui/index.jsx';

const NotFound = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 max-w-md"
    >
      <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-500/15 flex items-center justify-center">
        <Zap className="w-10 h-10 text-brand-400" />
      </div>
      <div>
        <h1 className="text-8xl font-black gradient-text">404</h1>
        <h2 className="text-2xl font-bold text-foreground mt-2">Page not found</h2>
        <p className="text-muted mt-2">The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <Link to="/">
        <Button size="lg" id="not-found-home-btn">
          <Home className="w-4 h-4" /> Go home
        </Button>
      </Link>
    </motion.div>
  </div>
);

export default NotFound;
