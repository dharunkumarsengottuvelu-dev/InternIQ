import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, RefreshCw, ExternalLink, AlertCircle, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import Navbar from '@/components/common/Navbar';
import ResumeUploader from '@/components/resume/ResumeUploader';
import ATSScoreCard from '@/components/resume/ATSScoreCard';
import { Card, CardBody, Badge, Button, Progress } from '@/components/ui/index.jsx';
import resumeService from '@/services/resumeService';
import testService from '@/services/testService';
import useResumeStore from '@/store/resumeStore';
import useAuthStore from '@/store/authStore';

let socket = null;

const ResumePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    resumeUrl, atsReport, atsScore, parsedResume,
    jobStatus, fetchATSReport, setATSReport, setJobProgress, jobMessage,
  } = useResumeStore();

  const [testGeneration, setTestGeneration] = useState({
    status: 'idle', // idle | generating | ready | error
    message: '',
    progress: 0,
    testId: null
  });

  const hasFetched = useRef(false);

  // Fetch existing report on mount (once only)
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchATSReport();
  }, []);

  // Fetch existing test on mount
  useEffect(() => {
    const checkTest = async () => {
      try {
        const { data } = await testService.getMyTest();
        if (data?.data) {
          setTestGeneration({
            status: 'ready',
            message: 'Your customized assessment test is ready!',
            progress: 100,
            testId: data.data._id
          });
        }
      } catch {
        // No active test yet — that's fine
      }
    };
    checkTest();
  }, []);

  // WebSocket for real-time job progress
  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';

    // Disconnect any previous socket before creating a new one
    if (socket) socket.disconnect();

    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('🔌 WebSocket error:', err.message);
    });

    socket.on('job:progress', ({ progress, status, message }) => {
      setJobProgress(progress, status, message);
    });

    socket.on('ats:complete', ({ atsReport: report, atsScore: score }) => {
      setATSReport(report, score);
      useAuthStore.getState().updateUser({ atsScore: score });
    });

    socket.on('ats:failed', ({ message }) => {
      setJobProgress(0, 'failed', message || 'ATS analysis failed. Please re-upload.');
    });

    socket.on('test:progress', ({ message, progress }) => {
      setTestGeneration({ status: 'generating', message, progress, testId: null });
    });

    socket.on('test:complete', ({ message, testId }) => {
      setTestGeneration({ status: 'ready', message, progress: 100, testId });
      useAuthStore.getState().updateUser({ activeTestId: testId });
      // Instantly redirect to the test page as requested by user
      navigate('/student/test');
    });

    socket.on('test:error', ({ message }) => {
      setTestGeneration({ status: 'error', message, progress: 0, testId: null });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [user?._id]); // re-connect if user changes

  const handleReanalyze = async () => {
    try {
      await resumeService.reanalyze();
      setJobProgress(0, 'parsing', 'Re-analysis started…');
    } catch (err) {
      console.error(err);
    }
  };

  const isAnalyzing = ['parsing', 'analyzing', 'uploading'].includes(jobStatus);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <FileText className="w-7 h-7 text-brand-400" />
              Resume &amp; ATS Analysis
            </h1>
            <p className="text-muted mt-1">Upload your resume for AI-powered ATS scoring and skill extraction</p>
          </div>

          {resumeUrl && !isAnalyzing && (
            <div className="flex items-center gap-2">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" id="view-resume-btn">
                  <ExternalLink className="w-3.5 h-3.5" /> View Resume
                </Button>
              </a>
              <Button variant="outline" size="sm" onClick={handleReanalyze} id="reanalyze-btn">
                <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
              </Button>
            </div>
          )}
        </motion.div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted">
            <span className="text-brand-500 font-medium">How it works: </span>
            Upload your PDF or DOCX resume → Our AI extracts structured data → ATS scoring runs in background → Results appear here in real-time via WebSocket.
          </div>
        </motion.div>

        {/* Upload / progress section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <ResumeUploader />
        </motion.div>

        {/* Test Generation card — show whenever a test exists or is generating */}
        {testGeneration.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-brand-500/20 bg-brand-500/5">
              <CardBody className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/15 flex items-center justify-center">
                    {testGeneration.status === 'ready' ? (
                      <CheckCircle className="w-6 h-6 text-success-500" />
                    ) : testGeneration.status === 'error' ? (
                      <AlertCircle className="w-6 h-6 text-danger-500" />
                    ) : (
                      <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">AI Customized Assessment</h3>
                    <p className="text-sm text-muted">{testGeneration.message || 'Generating your test…'}</p>
                  </div>
                  {testGeneration.status === 'ready' && (
                    <Button onClick={() => navigate('/student/test')} id="start-test-btn" className="gap-2">
                      Start Test <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {testGeneration.status === 'generating' && (
                  <Progress value={testGeneration.progress} max={100} color="brand" showLabel />
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Parsed resume preview */}
        {parsedResume && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-bold text-foreground">Extracted Profile</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {parsedResume.name && (
                    <div><span className="text-muted">Name:</span> <span className="text-foreground ml-2 font-medium">{parsedResume.name}</span></div>
                  )}
                  {parsedResume.email && (
                    <div><span className="text-muted">Email:</span> <span className="text-foreground ml-2">{parsedResume.email}</span></div>
                  )}
                  {parsedResume.education?.[0] && (
                    <div><span className="text-muted">Education:</span> <span className="text-foreground ml-2">{parsedResume.education[0].institution}</span></div>
                  )}
                  {parsedResume.experience?.length > 0 && (
                    <div><span className="text-muted">Experience:</span> <span className="text-foreground ml-2">{parsedResume.experience.length} position(s)</span></div>
                  )}
                </div>

                {parsedResume.skills?.technical?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-2">Technical Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedResume.skills.technical.slice(0, 15).map((s) => (
                        <Badge key={s} variant="brand" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* ATS Report */}
        {atsReport && (
          <ATSScoreCard atsReport={atsReport} atsScore={atsScore} />
        )}
      </div>
    </div>
  );
};

export default ResumePage;
