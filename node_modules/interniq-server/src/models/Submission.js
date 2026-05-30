import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── MCQ Submission ───────────────────────────────────────────
const MCQAnswerSchema = new Schema({
  questionId:     { type: String, required: true },
  selectedAnswer: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
  isCorrect:      Boolean,
  timeTaken:      Number, // seconds
}, { _id: false });

const MCQSubmissionSchema = new Schema(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId:         { type: Schema.Types.ObjectId, ref: 'Test',  required: true, index: true },
    answers:        [MCQAnswerSchema],
    score:          { type: Number, min: 0, max: 100 },
    correctCount:   Number,
    totalQuestions: Number,
    completedAt:    Date,
    timeTakenTotal: Number, // seconds
    tabSwitchCount: { type: Number, default: 0 },
    flagged:        { type: Boolean, default: false },
    flagReasons:    [String], // e.g. ['excessive_tab_switches', 'time_anomaly']
  },
  { timestamps: true }
);

// ─── Coding Submission ────────────────────────────────────────
const ExecutionResultSchema = new Schema({
  status:   String, // 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', etc.
  stdout:   String,
  stderr:   String,
  time:     String, // execution time
  memory:   String, // memory used
  exitCode: Number,
}, { _id: false });

const TestCaseResultSchema = new Schema({
  input:    String,
  expected: String,
  actual:   String,
  passed:   Boolean,
}, { _id: false });

const CodingSubmissionSchema = new Schema(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId:     { type: Schema.Types.ObjectId, ref: 'Test' },
    questionId: { type: String, required: true },
    language: {
      type: String,
      enum: ['python', 'javascript', 'java', 'cpp', 'c', 'go', 'rust'],
      required: true,
    },
    code:            { type: String, required: true },
    executionResult: ExecutionResultSchema,

    // Visible test case results (returned to student)
    testCaseResults: [TestCaseResultSchema],

    // Hidden test case stats (not detailed results, just pass/fail counts)
    hiddenTestsPassed: Number,
    hiddenTestsTotal:  Number,

    codeQualityScore: { type: Number, min: 0, max: 100 },
    codeQualityFeedback: Schema.Types.Mixed,

    // Composite score per spec §4.15
    totalScore:  { type: Number, min: 0, max: 100 },
    submittedAt: Date,
  },
  { timestamps: true }
);

export const MCQSubmission    = mongoose.model('MCQSubmission',    MCQSubmissionSchema);
export const CodingSubmission = mongoose.model('CodingSubmission', CodingSubmissionSchema);
