import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { getIO } from '../config/socket.js';
import logger from '../utils/logger.js';
import { generateAssessment } from '../services/ai/testGenerator.js';
import Test from '../models/Test.js';
import User from '../models/User.js';

let worker = null;

export const startTestGeneratorWorker = () => {
  if (worker) return worker;

  worker = new Worker(
    'test-generator',
    async (job) => {
      const { userId, skills, resumeText } = job.data;
      const io = getIO();

      const checkActive = async () => {
        const { getQueues } = await import('../config/queues.js');
        const fresh = await getQueues().testGenerator.getJob(job.id);
        return !!fresh;
      };

      try {
        logger.info(`[Job ${job.id}] Generating test for user ${userId} with skills: ${skills.join(', ')}`);
        
        if (!(await checkActive())) {
          logger.info(`🛑 Test generation aborted for user ${userId}: job ${job.id} is no longer active.`);
          return;
        }
        io.to(userId).emit('test:progress', {
          step: 'generating',
          message: 'AI is generating a customized assessment based on your skills and resume...',
          progress: 30,
        });

        // 1. Call Groq to generate the test
        const testData = await generateAssessment(skills, resumeText);

        if (!(await checkActive())) {
          logger.info(`🛑 Test generation aborted for user ${userId}: job ${job.id} is no longer active.`);
          return;
        }
        io.to(userId).emit('test:progress', {
          step: 'saving',
          message: 'Test generated successfully. Saving to database...',
          progress: 80,
        });

        // 2. Save the test to MongoDB
        const newTest = await Test.create({
          userId,
          generatedFromSkills: skills,
          status: 'generated',
          mcqs: testData.mcqs,
          codingQuestions: testData.codingQuestions,
        });

        // Optionally associate the test with the user or update their status
        await User.findByIdAndUpdate(userId, { activeTestId: newTest._id });

        if (!(await checkActive())) {
          logger.info(`🛑 Test generation aborted for user ${userId}: job ${job.id} is no longer active.`);
          // Delete orphaned test if created before cancel
          await Test.findByIdAndDelete(newTest._id);
          return;
        }
        io.to(userId).emit('test:complete', {
          message: 'Your assessment is ready!',
          testId: newTest._id,
        });

        logger.info(`[Job ${job.id}] Successfully created Test ${newTest._id} for User ${userId}`);
        return { success: true, testId: newTest._id };
        
      } catch (error) {
        logger.error(`[Job ${job.id}] Test generation failed:`, error);
        io.to(userId).emit('test:error', {
          message: error.message || 'Failed to generate assessment. Please try again.',
        });
        throw error;
      }
    },
    { connection: getRedisClient() }
  );

  worker.on('failed', (job, err) => {
    logger.error(`❌ Job ${job.id} (test-generator) failed: ${err.message}`);
  });

  logger.info('👷 test-generator worker started');
  return worker;
};
