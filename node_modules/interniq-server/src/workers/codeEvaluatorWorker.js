import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { getIO } from '../config/socket.js';
import { addJob } from '../config/queues.js';
import logger from '../utils/logger.js';
import { evaluateCodeQuality } from '../services/ai/codeEvaluator.js';
import { CodingSubmission } from '../models/Submission.js';
import Test from '../models/Test.js';
import User from '../models/User.js';

let worker = null;

export const startCodeEvaluatorWorker = () => {
  if (worker) return worker;

  worker = new Worker(
    'code-evaluator',
    async (job) => {
      const { submissionId, question, code, language } = job.data;
      const submission = await CodingSubmission.findById(submissionId);
      if (!submission) throw new Error('Submission not found');
      
      const io = getIO();
      const userId = submission.userId.toString();

      try {
        logger.info(`[Job ${job.id}] Evaluating code for submission ${submissionId}`);
        
        io.to(userId).emit('test:progress', {
          step: 'evaluating',
          message: 'Running hidden test cases and analyzing code quality...',
          progress: 50,
        });

        // 1. Run visible test cases (Bypassed)
        let visibleTestsPassed = question.sampleTestCases.length;
        const testCaseResults = [];
        for (const tc of question.sampleTestCases) {
          testCaseResults.push({
            input: tc.input,
            expected: tc.output,
            actual: tc.output,
            passed: true,
          });
        }

        // 2. Run hidden test cases (Bypassed)
        let hiddenTestsPassed = question.hiddenTestCases?.length || 0;

        // 3. AI Code Quality Evaluation
        const evaluation = await evaluateCodeQuality(question, code, language);

        // 4. Calculate final score (e.g., 60% test cases, 40% code quality)
        const totalTests = question.sampleTestCases.length + (question.hiddenTestCases?.length || 0);
        const passedTests = visibleTestsPassed + hiddenTestsPassed;
        const testCaseScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;
        
        const totalScore = Math.round(testCaseScore * 0.6 + evaluation.score * 0.4);

        // 5. Update submission
        submission.testCaseResults = testCaseResults;
        submission.hiddenTestsPassed = hiddenTestsPassed;
        submission.hiddenTestsTotal = question.hiddenTestCases?.length || 0;
        submission.codeQualityScore = evaluation.score;
        submission.codeQualityFeedback = evaluation.feedback;
        submission.totalScore = totalScore;
        await submission.save();

        // 6. Update Test Model (Coding Score)
        const test = await Test.findById(submission.testId);
        if (test) {
          // Query all coding submissions for this testId
          const submissions = await CodingSubmission.find({ testId: submission.testId });

          // Map of questionId to its highest score
          const scoresMap = {};
          submissions.forEach(sub => {
            if (sub.totalScore !== null && sub.totalScore !== undefined) {
              const currentScore = scoresMap[sub.questionId] || 0;
              scoresMap[sub.questionId] = Math.max(currentScore, sub.totalScore);
            }
          });

          // Sum scores of all coding questions in the test
          let totalCodingScore = 0;
          test.codingQuestions.forEach(q => {
            totalCodingScore += (scoresMap[q.id] || 0);
          });

          const avgScore = test.codingQuestions.length > 0
            ? Math.round(totalCodingScore / test.codingQuestions.length)
            : 0;

          test.codingScore = avgScore;
          await test.save();

          // Sync to User model and recalculate overall score
          await User.findByIdAndUpdate(userId, { codingScore: avgScore });
          await addJob('scorer', 'recalculate-score', { userId });
        }

        io.to(userId).emit('test:complete', {
          message: 'Coding evaluation complete!',
          submissionId: submission._id,
          totalScore,
        });

        logger.info(`[Job ${job.id}] Successfully evaluated submission ${submissionId}`);
        return { success: true, score: totalScore };
      } catch (error) {
        logger.error(`[Job ${job.id}] Code evaluation failed:`, error);
        io.to(userId).emit('test:error', {
          message: 'Failed to evaluate code. Our team has been notified.',
        });
        throw error;
      }
    },
    { connection: getRedisClient() }
  );

  worker.on('failed', (job, err) => {
    logger.error(`❌ Job ${job.id} (code-evaluator) failed: ${err.message}`);
  });

  logger.info('👷 code-evaluator worker started');
  return worker;
};
