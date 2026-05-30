import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText, Brain, Briefcase, TrendingUp, ArrowRight,
  Upload, CheckCircle, Clock, Zap, BarChart3, Sparkles, MapPin, DollarSign, ExternalLink
} from 'lucide-react';
import { Card, CardBody, Badge, Skeleton } from '@/components/ui/index.jsx';
import { Button } from '@/components/ui/index.jsx';
import ScoreDonut from '@/components/charts/ScoreDonut';
import SkillRadar from '@/components/charts/SkillRadar';
import Navbar from '@/components/common/Navbar';
import useAuthStore from '@/store/authStore';
import useResumeStore from '@/store/resumeStore';
import recommendationService from '@/services/recommendationService';
import { getScoreColor, getScoreLabel, formatRelativeTime, cn, getSafeApplyLink } from '@/lib/utils';

const ScoreCard = ({ label, score, icon: Icon, color, weight, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Card className="relative overflow-hidden" glow={score >= 80}>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <Badge variant="neutral" className="text-xs">{weight}%</Badge>
        </div>
        <div>
          <p className="text-xs text-surface-muted font-medium uppercase tracking-wide">{label}</p>
          {score !== null && score !== undefined ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
              className="flex items-baseline gap-1 mt-1"
            >
              <span className={`text-3xl font-black ${getScoreColor(score)}`}>{score}</span>
              <span className="text-surface-muted text-sm">/100</span>
            </motion.div>
          ) : (
            <div className="mt-1">
              <span className="text-2xl font-black text-surface-muted">–</span>
              <p className="text-xs text-surface-muted mt-1">Not yet assessed</p>
            </div>
          )}
          {score !== null && (
            <p className={`text-xs font-semibold mt-1 ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </p>
          )}
        </div>

        {/* Subtle bottom progress bar */}
        <div className="h-1 bg-surface-700/50 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', score >= 80 ? 'bg-success-500' : score >= 60 ? 'bg-warning-500' : 'bg-danger-500')}
            initial={{ width: 0 }}
            animate={{ width: score != null ? `${score}%` : '0%' }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: delay + 0.3 }}
          />
        </div>
      </CardBody>
    </Card>
  </motion.div>
);

const QuickAction = ({ icon: Icon, label, to, desc, color }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-5 cursor-pointer hover:border-brand-500/30 transition-all duration-200 flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold dark:text-white text-sm">{label}</p>
        <p className="text-xs text-surface-muted mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-surface-muted ml-auto mt-0.5 flex-shrink-0" />
    </motion.div>
  </Link>
);

const Dashboard = () => {
  const { user, refreshUser } = useAuthStore();
  const { fetchATSReport, atsScore, parsedResume } = useResumeStore();
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.resumeUrl) fetchATSReport();
  }, [user?.resumeUrl]);

  useEffect(() => {
    if (user?.resumeUrl) {
      const fetchRecs = async () => {
        setLoadingRecs(true);
        try {
          const { data } = await recommendationService.getRecommendations();
          if (data?.data) {
            setRecommendations(data.data.slice(0, 3));
          }
        } catch (err) {
          console.error('Failed to fetch recommendations:', err);
        } finally {
          setLoadingRecs(false);
        }
      };
      fetchRecs();
    }
  }, [user?.resumeUrl]);

  const scores = {
    ats:     user?.atsScore     ?? null,
    mcq:     user?.mcqScore     ?? null,
    coding:  user?.codingScore  ?? null,
    overall: user?.overallScore ?? null,
  };

  const skills = parsedResume?.skills
    ? [...(parsedResume.skills.technical || []), ...(parsedResume.skills.frameworks || [])]
    : [];

  if (!user?.resumeUrl) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex flex-col justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card p-10 text-center relative overflow-hidden border border-brand-500/20"
          >
            {/* Ambient background glow */}
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />

            <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 mb-6">
              <Zap className="w-10 h-10 text-brand-400 animate-pulse" />
            </div>

            <h1 className="text-4xl font-black text-foreground mb-4">
              Welcome to InternIQ, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto mb-10 text-base leading-relaxed">
              Your AI-driven career companion. Get parsed resume profiles, customized skills assessments, and semantically matched internships in minutes.
            </p>

            {/* Stepper */}
            <div className="grid md:grid-cols-3 gap-6 text-left mb-10">
              <div className="bg-subtle p-5 rounded-2xl border border-border space-y-2">
                <Badge variant="brand">Step 1</Badge>
                <h3 className="font-bold text-foreground text-sm">Upload Resume</h3>
                <p className="text-xs text-muted-foreground">Extract technical skills and check your ATS readability score.</p>
              </div>
              <div className="bg-subtle p-5 rounded-2xl border border-border space-y-2 opacity-60">
                <Badge variant="secondary">Step 2</Badge>
                <h3 className="font-bold text-foreground text-sm">Take AI Assessment</h3>
                <p className="text-xs text-muted-foreground">Complete customized MCQ and coding tests matching your skills.</p>
              </div>
              <div className="bg-subtle p-5 rounded-2xl border border-border space-y-2 opacity-60">
                <Badge variant="secondary">Step 3</Badge>
                <h3 className="font-bold text-foreground text-sm">Get Matched</h3>
                <p className="text-xs text-muted-foreground">Receive re-ranked internship recommendations based on performance.</p>
              </div>
            </div>

            <Link to="/student/resume">
              <Button size="lg" className="group px-8 py-6 text-base font-bold shadow-lg shadow-brand-500/20">
                Upload Resume to Begin
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* ─── Header ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground">
                Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-muted-foreground mt-1">Here's your career intelligence dashboard</p>
            </div>
            {!user?.resumeUrl && (
              <Link to="/student/resume">
                <Button id="dashboard-upload-resume-btn" className="group">
                  <Upload className="w-4 h-4" />
                  Upload Resume
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>

          {/* Step 2 CTA */}
          {user?.resumeUrl && user?.mcqScore === null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-5 bg-accent-500/10 border border-accent-500/20 rounded-2xl flex items-center gap-4"
            >
              <Brain className="w-8 h-8 text-accent-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-base font-bold text-accent-300">
                  {user?.mcqScore === null ? 'Step 2: Complete Your Skill Assessment' : 'Retake Skill Assessment'}
                </p>
                <p className="text-sm text-slate-400">
                  {user?.mcqScore === null
                    ? 'Our AI has generated a customized MCQ and coding test based on your parsed skills. Take the test to unlock internship matching.'
                    : 'You can retake the customized AI assessment to improve your score and get better internship recommendations.'}
                </p>
              </div>
              <Link to="/student/test">
                <Button size="md" id="dashboard-take-test-btn" className="gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold">
                  {user?.mcqScore === null ? 'Take Assessment' : 'Retake Assessment'} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* ─── Score Cards ──────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ScoreCard label="ATS Resume"  score={scores.ats}     icon={FileText}   color="bg-brand-500"   weight={30} delay={0}    />
          <ScoreCard label="MCQ Test"    score={scores.mcq}     icon={Brain}      color="bg-accent-500"  weight={30} delay={0.1}  />
          <ScoreCard label="Coding Test" score={scores.coding}  icon={BarChart3}  color="bg-cyan-500"    weight={40} delay={0.2}  />
          <ScoreCard label="Overall"     score={scores.overall} icon={TrendingUp} color="bg-gradient-brand" weight={100} delay={0.3} />
        </div>

        {/* ─── Main Grid ───────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Score donut */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardBody className="space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-500" />
                  Score Breakdown
                </h3>
                <div className="flex justify-center">
                  <ScoreDonut
                    atsScore={scores.ats}
                    mcqScore={scores.mcq}
                    codingScore={scores.coding}
                    overallScore={scores.overall}
                  />
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Skill radar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardBody className="space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-accent-500" />
                  Skill Profile
                </h3>
                <SkillRadar skills={skills} />
              </CardBody>
            </Card>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-3">
              <QuickAction icon={Upload}   label="Upload Resume"       desc="Get ATS score & analysis" to="/student/resume"      color="bg-brand-500" />
              <QuickAction icon={Brain}    label="Take Assessment"     desc="AI skill evaluation"      to="/student/test"        color="bg-accent-500" />
              <QuickAction icon={Briefcase}label="Browse Internships"  desc="AI-matched opportunities" to="/student/internships" color="bg-cyan-500" />
              <QuickAction icon={TrendingUp}label="View Progress"      desc="Track your improvement"   to="/profile"    color="bg-emerald-500" />
            </div>
          </motion.div>
        </div>

        {/* ─── Internship Recommendations ────────────────────── */}
        {user?.resumeUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-8 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                Top Internship Recommendations
              </h2>
              <Link to="/student/internships" className="text-sm font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingRecs ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map(n => <Skeleton key={n} className="h-48 w-full rounded-2xl" />)}
              </div>
            ) : recommendations.length === 0 ? (
              <Card>
                <CardBody className="text-center py-8">
                  <p className="text-surface-muted text-sm">No internship matches found. Check your profile skills or try again.</p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {recommendations.map((internship, index) => (
                  <Card key={internship._id} className="h-full flex flex-col hover:border-brand-500/50 transition-colors bg-card/50 backdrop-blur-sm group relative overflow-hidden">
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-10">
                        <Sparkles size={12} /> Best Fit
                      </div>
                    )}
                    <CardBody className="p-6 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-brand-500 transition-colors line-clamp-1">{internship.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{internship.company}</p>
                      </div>

                      {internship.matchReason && (
                        <div className="bg-brand-500/5 border border-brand-500/10 rounded-lg p-2.5 text-xs text-muted-foreground flex gap-2 items-start">
                          <Brain className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                          <p className="italic line-clamp-2">{internship.matchReason}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <MapPin size={10} /> {internship.location || internship.mode}
                        </Badge>
                        {internship.stipend?.amount && (
                          <Badge variant="outline" className="flex items-center gap-0.5">
                            <DollarSign size={10} /> {internship.stipend.amount}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 w-full">
                        <a 
                          href={getSafeApplyLink(internship)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex-1"
                        >
                          <Button 
                            size="sm"
                            className="w-full gap-1 text-xs" 
                          >
                            Apply Now <ExternalLink size={12} />
                          </Button>
                        </a>
                        <a
                          href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${internship.company} ${internship.title}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Search on LinkedIn"
                        >
                          <Button variant="outline" size="sm" className="px-2" title="Search on LinkedIn">
                            <Briefcase size={12} className="text-brand-500" />
                          </Button>
                        </a>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Skills Preview ───────────────────────────────── */}
        {skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    Extracted Skills
                  </h3>
                  <Badge variant="brand">{skills.length} skills</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 20).map((skill) => (
                    <Badge key={skill} variant="neutral" className="text-xs capitalize">{skill}</Badge>
                  ))}
                  {skills.length > 20 && (
                    <Badge variant="brand">+{skills.length - 20} more</Badge>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default Dashboard;
