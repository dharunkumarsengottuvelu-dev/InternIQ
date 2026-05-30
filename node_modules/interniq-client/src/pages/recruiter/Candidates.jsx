import React, { useEffect, useState } from 'react';
import Navbar from '@/components/common/Navbar';
import PageLoader from '@/components/common/PageLoader';
import { Card, CardBody } from '@/components/ui/index.jsx';
import adminService from '@/services/adminService';
import toast from 'react-hot-toast';
import { Search, Download, ExternalLink } from 'lucide-react';

const Candidates = () => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        // We reuse the admin users fetch, but filter for students. 
        // In a real scenario with matched candidates, we'd fetch from a /recruiter/candidates endpoint
        const res = await adminService.getUsers({ page: 1, limit: 50 });
        setCandidates(res.data?.data?.users || []);
      } catch (err) {
        toast.error('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Candidates</h1>
            <p className="text-muted-foreground">
              Review candidates matching your internship postings.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search candidates..." 
              className="pl-9 pr-4 py-2 bg-input border border-border rounded-lg text-sm w-64 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Candidate</th>
                    <th className="px-6 py-4 font-medium">Overall Score</th>
                    <th className="px-6 py-4 font-medium">ATS Score</th>
                    <th className="px-6 py-4 font-medium">Coding Score</th>
                    <th className="px-6 py-4 font-medium">Top Skills</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidates.map((candidate) => (
                    <tr key={candidate._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{candidate.name}</div>
                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                          {candidate.overallScore || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">{candidate.atsScore || '--'}/100</td>
                      <td className="px-6 py-4">{candidate.codingScore || '--'}/100</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(candidate.skills || []).slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
                              {skill}
                            </span>
                          ))}
                          {(candidate.skills?.length > 3) && <span className="text-xs text-muted-foreground">+{candidate.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="View Profile">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {candidate.resumeUrl && (
                            <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Download Resume">
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                        No candidates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
};

export default Candidates;
