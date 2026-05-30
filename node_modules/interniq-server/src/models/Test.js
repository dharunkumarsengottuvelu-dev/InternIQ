import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── MCQ Sub-schema ───────────────────────────────────────────
const MCQSchema = new Schema({
  id:           { type: String, required: true },
  question:     String,
  codeSnippet:  String,
  options:      { A: String, B: String, C: String, D: String },
  correctAnswer:{ type: String, enum: ['A', 'B', 'C', 'D'], select: false }, // never sent to client
  explanation:  { type: String, select: false },
  skill:        String,
  difficulty:   { type: String, enum: ['easy', 'medium', 'hard'] },
  timeLimit:    { type: Number, default: 60 }, // seconds
}, { _id: false });

// ─── Test Case Sub-schema ─────────────────────────────────────
const TestCaseSchema = new Schema({
  input:       String,
  output:      String,
  explanation: String,
}, { _id: false });

const HiddenTestCaseSchema = new Schema({
  input:  String,
  output: String,
}, { _id: false });

// ─── Coding Question Sub-schema ───────────────────────────────
const CodingQuestionSchema = new Schema({
  id:              { type: String, required: true },
  title:           String,
  description:     String,
  inputFormat:     String,
  outputFormat:    String,
  constraints:     [String],
  sampleTestCases: [TestCaseSchema],
  hiddenTestCases: { type: [HiddenTestCaseSchema], select: false }, // NEVER exposed to client
  expectedTimeComplexity:  String,
  expectedSpaceComplexity: String,
  tags:        [String],
  points:      { type: Number, default: 100 },
  timeLimit:   { type: Number, default: 2 },   // seconds for execution
  memoryLimit: { type: Number, default: 256 },  // MB
}, { _id: false });

// ─── Test Schema ──────────────────────────────────────────────
const TestSchema = new Schema(
  {
    userId:             { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    generatedFromSkills:[String],
    status:             {
      type: String,
      enum: ['generated', 'approved', 'active', 'completed', 'expired', 'archived'],
      default: 'generated',
      index: true,
    },

    mcqs:            [MCQSchema],
    codingQuestions: [CodingQuestionSchema],

    // Results (populated after submission)
    mcqScore:    { type: Number, min: 0, max: 100, default: null },
    codingScore: { type: Number, min: 0, max: 100, default: null },

    startedAt:   Date,
    completedAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index — auto-delete expired tests
TestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Test = mongoose.model('Test', TestSchema);
export default Test;
