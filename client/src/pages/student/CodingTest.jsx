import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Send, ChevronRight, ChevronLeft, Terminal, Layout, FileCode2, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

import Navbar from '@/components/common/Navbar';
import PageLoader from '@/components/common/PageLoader';
import { Button, Card, CardBody, Badge } from '@/components/ui/index.jsx';
import MCQQuestion from '@/components/test/MCQQuestion';
import Timer from '@/components/test/Timer';
import SubmitModal from '@/components/test/SubmitModal';

import useTestStore from '@/store/testStore';
import useAuthStore from '@/store/authStore';
import testService from '@/services/testService';

const CodingTest = () => {
  const navigate = useNavigate();
  const { activeTest, testStatus, setActiveTest, clearTest, incrementTabSwitch, codingAnswers, setCodingAnswer, loadSavedAnswers } = useTestStore();
  const { user, refreshUser } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mcq'); // 'mcq' or 'coding'
  const [currentMCQ, setCurrentMCQ] = useState(0);
  const [currentCoding, setCurrentCoding] = useState(0);
  
  const [outputResult, setOutputResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [testGeneration, setTestGeneration] = useState({
    status: 'idle', // idle | generating | ready | error
    message: '',
    progress: 0,
    testId: null
  });

  const loadActiveTest = async () => {
    try {
      const { data } = await testService.getMyTest();
      if (data?.data) {
        setActiveTest(data.data);
        loadSavedAnswers(data.data._id);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        // No active test is normal if they completed it and want to retake.
        setActiveTest(null);
      } else {
        toast.error("Error loading test");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize test data
  useEffect(() => {
    loadActiveTest();
  }, [setActiveTest, loadSavedAnswers]);

  const handleGenerateTest = async () => {
    if (!user?.skills || user.skills.length === 0) {
      toast.error("No skills found on your profile. Please upload a resume first.");
      return;
    }
    
    setTestGeneration({
      status: 'generating',
      message: 'Submitting request to AI test generator...',
      progress: 10,
      testId: null
    });
    
    try {
      await testService.generateTest(user.skills);
      
      const token = useAuthStore.getState().accessToken;
      const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket']
      });
      
      socket.on('connect', () => {
        console.log('🔌 Test generator websocket connected');
      });
      
      socket.on('test:progress', ({ step, message, progress }) => {
        setTestGeneration({ status: 'generating', message, progress, testId: null });
      });
      
      socket.on('test:complete', async ({ message, testId }) => {
        setTestGeneration({ status: 'ready', message, progress: 100, testId });
        toast.success("Assessment is ready!");
        socket.disconnect();
        
        // Reload test
        setLoading(true);
        await loadActiveTest();
      });
      
      socket.on('test:error', ({ message }) => {
        setTestGeneration({ status: 'error', message, progress: 0, testId: null });
        toast.error(message || "Test generation failed");
        socket.disconnect();
      });
      
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to start test generation";
      toast.error(msg);
      setTestGeneration({ status: 'error', message: msg, progress: 0, testId: null });
    }
  };

  // Anti-cheat: Tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testStatus === 'active') {
        incrementTabSwitch();
        toast.error("Warning: Switching tabs during a test is recorded.", { icon: '⚠️' });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [testStatus, incrementTabSwitch]);

  const handleRunCode = async () => {
    if (!activeTest) return;
    const q = activeTest.codingQuestions[currentCoding];
    const answer = codingAnswers[q.id];
    
    if (!answer?.code) {
      toast.error('Please write some code before running');
      return;
    }

    setIsRunning(true);
    try {
      const payload = {
        code: answer.code,
        language: answer.language || 'javascript',
        input: q.sampleTestCases[0]?.input || ''
      };
      const { data } = await testService.runCode(payload);
      setOutputResult(data.data);
    } catch (err) {
      toast.error('Failed to run code');
      setOutputResult({ status: 'error', stderr: 'Execution service unavailable.' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!activeTest) return;
    setIsSubmitting(true);
    try {
      // 1. Submit MCQs
      const { answers, timeRemaining, tabSwitchCount } = useTestStore.getState();
      const mcqPayload = {
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
        timeTakenTotal: activeTest.mcqs.length * 60 - (timeRemaining || 0),
        tabSwitchCount
      };
      await testService.submitMCQ(activeTest._id, mcqPayload);

      // 2. Submit Coding Questions
      for (const q of activeTest.codingQuestions) {
        const ans = codingAnswers[q.id];
        if (ans?.code) {
          await testService.submitCode(activeTest._id, {
            questionId: q.id,
            code: ans.code,
            language: ans.language || 'javascript'
          });
        }
      }

      toast.success('Test submitted successfully!');
      clearTest();
      await refreshUser();
      navigate('/student/dashboard');
    } catch (err) {
      toast.error('Failed to submit test');
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!activeTest) {
    const hasCompletedTest = user?.mcqScore !== null && user?.mcqScore !== undefined;

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
              <Brain className="w-10 h-10 text-brand-400 animate-pulse" />
            </div>

            {hasCompletedTest ? (
              <>
                <h1 className="text-4xl font-black text-foreground mb-4">
                  Assessment Completed
                </h1>
                <p className="text-muted max-w-lg mx-auto mb-8 text-base leading-relaxed">
                  You have already completed your AI Skill Assessment. In accordance with platform policy, the assessment can only be taken once per candidate profile.
                </p>
                <div className="max-w-md mx-auto p-6 bg-surface-800/40 rounded-2xl border border-surface-700/50 mb-8 space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-surface-muted text-sm font-medium">MCQ Score:</span>
                    <span className="font-bold text-brand-400">{user.mcqScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-muted text-sm font-medium">Coding Score:</span>
                    <span className="font-bold text-cyan-400">{user.codingScore}/100</span>
                  </div>
                  <div className="flex justify-between border-t border-surface-700/50 pt-3">
                    <span className="text-surface-muted text-sm font-bold">Overall Rating:</span>
                    <span className="font-bold text-emerald-400">{user.overallScore}/100</span>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to request a retest? Your current test will be archived and a new test will be generated.")) {
                        try {
                          await testService.requestRetest();
                          toast.success("Retest requested! Please wait while we generate a new test.");
                          window.location.reload();
                        } catch(err) {
                          toast.error(err.response?.data?.message || "Failed to request retest");
                        }
                      }
                    }}
                    className="group px-8 py-6 text-base font-bold shadow-lg shadow-brand-500/10"
                  >
                    Request Retest
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/student/dashboard')}
                    className="group px-8 py-6 text-base font-bold shadow-lg shadow-brand-500/20"
                  >
                    Return to Dashboard
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-black text-foreground mb-4">
                  AI Skill Assessment
                </h1>

                {testGeneration.status === 'generating' ? (
              <div className="max-w-md mx-auto space-y-4 my-8">
                <p className="text-sm text-muted">{testGeneration.message || 'Generating your test...'}</p>
                <div className="h-2 w-full bg-subtle rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${testGeneration.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-xs text-brand-400 font-bold">{testGeneration.progress}% Complete</div>
              </div>
            ) : (
              <>
                <p className="text-muted max-w-lg mx-auto mb-10 text-base leading-relaxed">
                  {user?.skills?.length > 0 
                    ? "Generate a customized, AI-powered assessment containing MCQs and coding questions tailored specifically to your profile skills."
                    : "No active test found. Please upload your resume to extract skills first."}
                </p>

                {user?.skills?.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto mb-8">
                      {user.skills.slice(0, 15).map(skill => (
                        <Badge key={skill} variant="neutral" className="text-xs capitalize">{skill}</Badge>
                      ))}
                    </div>
                    <Button 
                      size="lg" 
                      onClick={handleGenerateTest} 
                      className="group px-8 py-6 text-base font-bold shadow-lg shadow-brand-500/20"
                    >
                      Generate AI Assessment
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/student/resume')} 
                    className="group px-8 py-6 text-base font-bold shadow-lg shadow-brand-500/20"
                  >
                    Go to Resume Upload
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  </div>
);
  }

  const totalMCQs = activeTest.mcqs?.length || 0;
  const totalCoding = activeTest.codingQuestions?.length || 0;
  const mcq = activeTest.mcqs?.[currentMCQ];
  const codingQ = activeTest.codingQuestions?.[currentCoding];

  return (
    <div className="h-screen bg-background flex flex-col pt-16">
      <Navbar />
      
      {/* Test Header */}
      <div className="border-b bg-card py-4 px-6 flex justify-between items-center shadow-sm">
        <div className="flex gap-4">
          <Button 
            variant={activeTab === 'mcq' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('mcq')}
            className="gap-2"
          >
            <Layout size={16}/> MCQs ({totalMCQs})
          </Button>
          <Button 
            variant={activeTab === 'coding' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('coding')}
            className="gap-2"
          >
            <FileCode2 size={16}/> Coding ({totalCoding})
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <Timer duration={totalMCQs * 60 + totalCoding * 1200} onExpire={handleFinalSubmit} />
          <Button variant="destructive" onClick={() => setShowSubmitModal(true)} className="gap-2">
            <Send size={16} /> Submit Test
          </Button>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* MCQ Section */}
        {activeTab === 'mcq' && mcq && (
          <div className="max-w-4xl mx-auto w-full p-8 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <MCQQuestion key={mcq.id} question={mcq} index={currentMCQ} />
              </AnimatePresence>
            </div>
            
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => setCurrentMCQ(p => Math.max(0, p - 1))}
                disabled={currentMCQ === 0}
              >
                <ChevronLeft className="mr-2" size={16} /> Previous
              </Button>
              <div className="text-sm text-muted-foreground font-medium">
                {currentMCQ + 1} of {totalMCQs}
              </div>
              {currentMCQ < totalMCQs - 1 ? (
                <Button onClick={() => setCurrentMCQ(p => Math.min(totalMCQs - 1, p + 1))}>
                  Next <ChevronRight className="ml-2" size={16} />
                </Button>
              ) : (
                <Button onClick={() => setActiveTab('coding')}>
                  Go to Coding <ChevronRight className="ml-2" size={16} />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Coding Section */}
        {activeTab === 'coding' && codingQ && (
          <div className="flex-1 flex flex-col w-full overflow-hidden">
            {/* Coding question navigator */}
            {totalCoding > 1 && (
              <div className="flex items-center justify-between px-6 py-2 border-b bg-zinc-900 border-zinc-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCurrentCoding(p => Math.max(0, p - 1)); setOutputResult(null); }}
                  disabled={currentCoding === 0}
                  className="gap-1 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                >
                  <ChevronLeft size={14} /> Prev
                </Button>
                <span className="text-sm font-medium text-zinc-400">
                  Problem {currentCoding + 1} of {totalCoding}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCurrentCoding(p => Math.min(totalCoding - 1, p + 1)); setOutputResult(null); }}
                  disabled={currentCoding === totalCoding - 1}
                  className="gap-1 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            )}

            <div className="flex-1 flex w-full overflow-hidden">
              {/* Problem Description Panel */}
              <div className="w-1/3 border-r bg-card flex flex-col overflow-y-auto custom-scrollbar p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-primary border-primary/50">
                    {codingQ.points} Points
                  </Badge>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Time: {codingQ.timeLimit}s</Badge>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">{codingQ.title}</h2>
                <div className="prose prose-invert text-sm max-w-none mb-6 text-muted-foreground whitespace-pre-wrap">
                  {codingQ.description}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Input Format</h4>
                    <p className="text-sm text-muted-foreground">{codingQ.inputFormat}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Output Format</h4>
                    <p className="text-sm text-muted-foreground">{codingQ.outputFormat}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Constraints</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {codingQ.constraints?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="font-semibold text-foreground mb-4">Sample Test Cases</h4>
                  {codingQ.sampleTestCases?.map((tc, idx) => (
                    <Card key={idx} className="mb-4 bg-zinc-950 border-zinc-800">
                      <CardBody className="p-4 space-y-3">
                        <div>
                          <div className="text-xs text-zinc-500 font-mono mb-1">Input:</div>
                          <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">{tc.input}</pre>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 font-mono mb-1">Output:</div>
                          <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap">{tc.output}</pre>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Editor Panel */}
              <div className="w-2/3 flex flex-col bg-[#1e1e1e]">
                <div className="flex justify-between items-center p-2 border-b border-zinc-800 bg-zinc-900">
                  <select 
                    className="bg-zinc-800 text-sm text-zinc-200 rounded px-3 py-1.5 border border-zinc-700 outline-none cursor-pointer"
                    value={codingAnswers[codingQ.id]?.language || 'javascript'}
                    onChange={(e) => setCodingAnswer(codingQ.id, codingAnswers[codingQ.id]?.code || '', e.target.value)}
                  >
                    <option value="javascript">JavaScript (Node 18)</option>
                    <option value="python">Python 3</option>
                    <option value="java">Java 15</option>
                    <option value="cpp">C++ 17</option>
                  </select>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRunCode} disabled={isRunning} className="gap-2 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200">
                      <Play size={14} className={isRunning ? "animate-pulse text-emerald-400" : "text-emerald-400"} /> 
                      {isRunning ? 'Running…' : 'Run Code'}
                    </Button>
                  </div>
                </div>

                <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    language={codingAnswers[codingQ.id]?.language || 'javascript'}
                    theme="vs-dark"
                    value={codingAnswers[codingQ.id]?.code || ''}
                    onChange={(val) => setCodingAnswer(codingQ.id, val, codingAnswers[codingQ.id]?.language || 'javascript')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: 'Consolas, monospace',
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      padding: { top: 16 }
                    }}
                  />
                </div>

                {/* Console Output */}
                <div className="h-52 border-t border-zinc-800 bg-zinc-950 flex flex-col">
                  <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <Terminal size={14} /> Console Output
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-sm">
                    {!outputResult ? (
                      <div className="text-zinc-600 italic">Run your code to see the output here...</div>
                    ) : outputResult.error ? (
                      <pre className="whitespace-pre-wrap text-red-400">{outputResult.error}</pre>
                    ) : (
                      <div>
                        {outputResult.stdout && (
                          <pre className="whitespace-pre-wrap text-zinc-200">{outputResult.stdout}</pre>
                        )}
                        {outputResult.stderr && (
                          <pre className="whitespace-pre-wrap mt-2 text-red-400">{outputResult.stderr}</pre>
                        )}
                        {outputResult.exitCode !== undefined && (
                          <div className={`mt-3 pt-2 border-t border-zinc-800/50 text-xs ${outputResult.exitCode === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            Exited with code {outputResult.exitCode} — {outputResult.exitCode === 0 ? '✓ Success' : '✗ Error'}
                            {outputResult.time && <span className="ml-4 text-zinc-500">⏱ {outputResult.time}ms</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SubmitModal 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleFinalSubmit}
        isSubmitting={isSubmitting}
        stats={{
          answeredMCQs: Object.keys(useTestStore.getState().answers).length,
          totalMCQs,
          attemptedCoding: Object.keys(codingAnswers).filter(k => codingAnswers[k]?.code?.trim()).length,
          totalCoding
        }}
      />
    </div>
  );
};

export default CodingTest;
