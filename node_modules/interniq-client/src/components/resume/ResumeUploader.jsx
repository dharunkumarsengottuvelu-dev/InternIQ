import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle, RefreshCw, Loader2, Square } from 'lucide-react';
import { Button, Progress } from '@/components/ui/index.jsx';
import useResumeStore from '@/store/resumeStore';
import { cn } from '@/lib/utils';
import { MAX_FILE_SIZE_MB, ALLOWED_RESUME_TYPES } from '@/constants';
import toast from 'react-hot-toast';

const ResumeUploader = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isStopping, setIsStopping] = useState(false);
  const inputRef = useRef(null);

  const { uploadProgress, jobStatus, jobMessage, resumeUrl, uploadResume, stopAnalysis } = useResumeStore();

  const isUploading = ['uploading', 'parsing', 'analyzing'].includes(jobStatus);
  const isComplete  = jobStatus === 'complete';
  const isFailed    = jobStatus === 'failed';

  const validateFile = (file) => {
    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      return 'Only PDF and DOCX files are supported';
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size must be under ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFile = useCallback((file) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setFileError(err); toast.error(err); return; }
    setFileError('');
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    const result = await uploadResume(selectedFile);
    if (!result.success) toast.error(result.message);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileError('');
    useResumeStore.getState().reset();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleStop = async () => {
    setIsStopping(true);
    const result = await stopAnalysis();
    setIsStopping(false);
    if (result.success) {
      setSelectedFile(null);
      setFileError('');
      if (inputRef.current) inputRef.current.value = '';
      toast.success('Resume analysis stopped');
    } else {
      toast.error(result.message);
    }
  };

  const statusSteps = [
    { key: 'uploading', label: 'Uploading file',      pct: 25 },
    { key: 'parsing',   label: 'Extracting text',     pct: 50 },
    { key: 'analyzing', label: 'AI ATS Analysis',     pct: 75 },
    { key: 'complete',  label: 'Analysis complete!',  pct: 100 },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === jobStatus);

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <AnimatePresence mode="wait">
        {!isUploading && !isComplete ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !selectedFile && inputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300',
                dragOver
                  ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
                  : selectedFile
                    ? 'border-success-500/50 bg-success-500/5'
                    : 'border-surface-border hover:border-brand-500/50 hover:bg-brand-500/5 cursor-pointer',
                isFailed && 'border-danger-500/50 bg-danger-500/5'
              )}
            >
              {/* Animated background orb */}
              {dragOver && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-brand-500/5"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              <input
                ref={inputRef}
                type="file"
                id="resume-file-input"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />

              <AnimatePresence mode="wait">
                {selectedFile ? (
                  <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-success-500/15 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-success-500" />
                    </div>
                    <div>
                      <p className="font-semibold dark:text-white text-base">{selectedFile.name}</p>
                      <p className="text-sm text-surface-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {fileError && (
                      <div className="flex items-center gap-2 text-danger-500 text-sm justify-center">
                        <AlertCircle className="w-4 h-4" /> {fileError}
                      </div>
                    )}
                    <div className="flex items-center gap-3 justify-center">
                      <Button onClick={handleUpload} size="md" id="upload-resume-btn">
                        <Upload className="w-4 h-4" /> Analyze Resume
                      </Button>
                      <Button onClick={handleReset} variant="ghost" size="md" id="reset-resume-btn">
                        <X className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <motion.div
                      animate={dragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                      className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/15 flex items-center justify-center"
                    >
                      <Upload className="w-7 h-7 text-brand-400" />
                    </motion.div>
                    <div>
                      <p className="font-semibold dark:text-white text-base">
                        {dragOver ? 'Drop your resume here' : 'Drag & drop your resume'}
                      </p>
                      <p className="text-sm text-surface-muted mt-1">
                        or <span className="text-brand-400 font-medium">browse files</span> · PDF or DOCX · Max {MAX_FILE_SIZE_MB}MB
                      </p>
                      {isFailed && jobMessage && (
                        <div className="mt-4 flex items-center gap-2 text-danger-500 text-sm justify-center bg-danger-500/10 p-2 rounded-lg border border-danger-500/20">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium text-left">{jobMessage}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : isUploading ? (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-surface-900/50 border border-surface-border rounded-2xl p-8 space-y-6"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/15 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold dark:text-white">AI Processing Resume</h3>
                  <p className="text-sm text-surface-muted">{jobMessage || 'Please wait...'}</p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleStop}
                loading={isStopping}
                className="gap-2 shrink-0 shadow-glow-sm hover:shadow-glow-md"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Stop Analysis
              </Button>
            </div>

            {/* Step indicators */}
            <div className="space-y-3">
              {statusSteps.map((step, i) => (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                    i < currentStepIndex  ? 'bg-success-500' :
                    i === currentStepIndex ? 'bg-brand-500' : 'bg-surface-700'
                  )}>
                    {i < currentStepIndex
                      ? <CheckCircle className="w-3 h-3 text-white" />
                      : i === currentStepIndex
                        ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        : <div className="w-2 h-2 bg-surface-500 rounded-full" />
                    }
                  </div>
                  <span className={cn(
                    'text-sm transition-colors',
                    i === currentStepIndex ? 'text-white font-medium' :
                    i < currentStepIndex   ? 'text-success-500' : 'text-surface-muted'
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <Progress value={uploadProgress} max={100} color="brand" showLabel />
          </motion.div>
        ) : isComplete ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-success-500/10 border border-success-500/30 rounded-2xl p-6 flex items-center gap-4"
          >
            <CheckCircle className="w-10 h-10 text-success-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-success-500">Analysis Complete!</h3>
              <p className="text-sm text-surface-muted">Your ATS report is ready below.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} id="reupload-btn">
              <RefreshCw className="w-3.5 h-3.5" /> Re-upload
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ResumeUploader;
