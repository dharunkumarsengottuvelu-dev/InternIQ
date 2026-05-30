import { addJob } from '../config/queues.js';
import Test from '../models/Test.js';
import User from '../models/User.js';
import { MCQSubmission, CodingSubmission } from '../models/Submission.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { runCode as executeCode } from '../services/compiler/codeRunner.js';

/**
 * Generate a new test based on skills
 * @route POST /api/v1/test/generate
 */
export const generateTest = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    throw new ApiError(400, 'Please provide an array of skills to generate the test.');
  }

  // Check if there's already an active, generated, or completed test (take once limit)
  const existingTest = await Test.findOne({
    userId: req.user._id,
    status: { $in: ['generated', 'active', 'completed'] },
  });

  if (existingTest) {
    throw new ApiError(400, 'You have already completed or generated your assessment.');
  }

  const resumeText = req.user.parsedResume?.resumeText || '';

  // Queue the test generation job
  await addJob('test-generator', `generate-${req.user._id}`, {
    userId: req.user._id,
    skills,
    resumeText, // Pass resumeText to generate tailored test questions
  });

  return ApiResponse.accepted(res, 'Test generation started. You will be notified when it is ready.');
});

/**
 * Retest: Archive current test and generate a new one
 * @route POST /api/v1/test/retest
 */
export const requestRetest = asyncHandler(async (req, res) => {
  const existingTest = await Test.findOne({
    userId: req.user._id,
    status: { $in: ['generated', 'active', 'completed'] },
  });

  if (existingTest) {
    existingTest.status = 'archived';
    await existingTest.save();
  }

  const skills = req.user.skills || [];
  if (skills.length === 0) {
    throw new ApiError(400, 'Please upload a resume first to extract your skills.');
  }

  const resumeText = req.user.parsedResume?.resumeText || '';

  // Queue the test generation job for the new test
  await addJob('test-generator', `generate-${req.user._id}`, {
    userId: req.user._id,
    skills,
    resumeText,
  });

  return ApiResponse.accepted(res, 'Retest requested. A new test is being generated.');
});

/**
 * Get the current active test for the user
 * @route GET /api/v1/test/my-test
 */
export const getMyTest = asyncHandler(async (req, res) => {
  const test = await Test.findOne({
    userId: req.user._id,
    status: { $in: ['generated', 'active'] },
  });

  if (!test) {
    throw new ApiError(404, 'No active test found.');
  }

  // If status was generated, mark it as active
  if (test.status === 'generated') {
    test.status = 'active';
    test.startedAt = new Date();
    await test.save();
  }

  return ApiResponse.success(res, 'Active test retrieved', test);
});

/**
 * Run arbitrary code in the sandbox (for the IDE's "Run" button)
 * @route POST /api/v1/test/run
 */
export const runCode = asyncHandler(async (req, res) => {
  const { code, language, input } = req.body;

  if (!code || !language) {
    throw new ApiError(400, 'Code and language are required.');
  }

  const result = await executeCode({ code, language, input: input || '' });

  // Always return 200 — errors are represented in the result body
  return ApiResponse.success(res, 'Code executed', result);
});

/**
 * Submit the MCQ section of the test
 * @route POST /api/v1/test/:testId/mcq
 */
export const submitMCQ = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const { answers, timeTakenTotal, tabSwitchCount } = req.body;

  const test = await Test.findOne({ _id: testId, userId: req.user._id }).select('+mcqs.correctAnswer');
  if (!test) throw new ApiError(404, 'Test not found.');

  // Calculate score
  let correctCount = 0;
  const processedAnswers = answers.map((ans) => {
    const question = test.mcqs.find((q) => q.id === ans.questionId);
    const isCorrect = question && question.correctAnswer === ans.selectedAnswer;
    if (isCorrect) correctCount++;
    return { ...ans, isCorrect };
  });

  const score = Math.round((correctCount / test.mcqs.length) * 100);

  const submission = await MCQSubmission.create({
    userId: req.user._id,
    testId,
    answers: processedAnswers,
    score,
    correctCount,
    totalQuestions: test.mcqs.length,
    completedAt: new Date(),
    timeTakenTotal,
    tabSwitchCount,
  });

  // Update test model with partial score
  test.mcqScore = score;
  await test.save();

  // Sync to User model and recalculate overall score
  await User.findByIdAndUpdate(req.user._id, { mcqScore: score });
  await addJob('scorer', 'recalculate-score', { userId: req.user._id.toString() });

  return ApiResponse.created(res, 'MCQ submitted', { score, submissionId: submission._id });
});

/**
 * Submit the coding section and mark test as completed
 * @route POST /api/v1/test/:testId/code
 */
export const submitCode = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const { questionId, code, language } = req.body;

  const test = await Test.findOne({ _id: testId, userId: req.user._id }).select('+codingQuestions.hiddenTestCases');
  if (!test) throw new ApiError(404, 'Test not found.');

  const question = test.codingQuestions.find((q) => q.id === questionId);
  if (!question) throw new ApiError(404, 'Coding question not found.');

  // Create pending submission
  const submission = await CodingSubmission.create({
    userId: req.user._id,
    testId,
    questionId,
    language,
    code,
    submittedAt: new Date(),
  });

  // Queue async evaluation of hidden test cases + code quality (LLM)
  await addJob('codeEvaluator', `evaluate-${submission._id}`, {
    submissionId: submission._id,
    question,
    code,
    language,
  });

  // Mark overall test as completed
  test.status = 'completed';
  test.completedAt = new Date();
  await test.save();

  return ApiResponse.accepted(res, 'Code submitted successfully. Evaluation is in progress.', { submissionId: submission._id });
});
