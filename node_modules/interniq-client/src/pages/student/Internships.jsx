import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, BrainCircuit, ExternalLink, Sparkles } from 'lucide-react';
import { Card, CardBody, Badge, Button } from '@/components/ui/index.jsx';
import Navbar from '@/components/common/Navbar';
import PageLoader from '@/components/common/PageLoader';
import recommendationService from '@/services/recommendationService';
import toast from 'react-hot-toast';
import { getRedirectUrl } from '@/lib/utils';

const Internships = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await recommendationService.getRecommendations();
        if (data?.data) {
          setInternships(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        toast.error('Failed to load personalized internships.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BrainCircuit className="text-primary" />
              AI Recommended Internships
            </h1>
            <p className="text-muted-foreground">
              These opportunities have been semantically matched to your parsed resume skills and assessment scores.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Search domain or company..." 
                className="pl-10 pr-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm focus:outline-none focus:border-primary transition-colors w-full md:w-64"
              />
            </div>
          </div>
        </div>

        {internships.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No recommendations yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We couldn't find any internships matching your profile. Make sure you have uploaded your resume and taken the assessment test.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {internships.map((internship, index) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm group relative overflow-hidden">
                    {/* Top match badge */}
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1 z-10">
                        <Sparkles size={12} /> Top Match
                      </div>
                    )}
                    
                    <CardBody className="flex-1 flex flex-col p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{internship.title}</h3>
                          <p className="text-muted-foreground font-medium">{internship.company}</p>
                        </div>
                      </div>

                      {/* AI Reasoning box */}
                      {internship.matchReason && (
                        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mb-4 text-sm text-muted-foreground relative">
                          <BrainCircuit size={14} className="absolute top-3 left-3 text-primary/70" />
                          <p className="pl-6 italic">{internship.matchReason}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <MapPin size={12} /> {internship.location || internship.mode}
                        </Badge>
                        {internship.stipend?.amount && (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            ₹{internship.stipend.amount?.toLocaleString('en-IN')}/mo
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {internship.duration}
                        </Badge>
                      </div>

                      <div className="mt-auto pt-4 space-y-4">
                        <div className="flex flex-wrap gap-1.5">
                          {internship.requiredSkills?.slice(0, 4).map(skill => (
                            <span
                              key={skill}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium border"
                              style={{
                                background: 'var(--surface-subtle)',
                                color: 'var(--surface-text)',
                                borderColor: 'var(--surface-border)',
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                          {internship.requiredSkills?.length > 4 && (
                            <span
                              className="text-xs px-2.5 py-1 rounded-lg font-medium border"
                              style={{
                                background: 'var(--surface-subtle)',
                                color: 'var(--surface-muted)',
                                borderColor: 'var(--surface-border)',
                              }}
                            >
                              +{internship.requiredSkills.length - 4} more
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 w-full">
                          <Button
                            className="flex-1 gap-2"
                            onClick={() => navigate(getRedirectUrl(internship))}
                          >
                            Apply Now <ExternalLink size={16} />
                          </Button>
                          <a
                            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${internship.company} ${internship.title}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Search on LinkedIn"
                          >
                            <Button variant="outline" className="px-3" title="Search on LinkedIn">
                              <Briefcase size={16} className="text-brand-500" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Internships;
