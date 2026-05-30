import mongoose from 'mongoose';

const { Schema } = mongoose;

const StipendSchema = new Schema({
  amount:       Number,
  currency:     { type: String, default: 'INR' },
  isNegotiable: { type: Boolean, default: false },
}, { _id: false });

const InternshipSchema = new Schema(
  {
    title:       { type: String, required: true, trim: true },
    company:     { type: String, required: true, trim: true },
    companyLogo: String,

    description:      { type: String, required: true },
    requiredSkills:   [{ type: String, lowercase: true, trim: true }],
    niceToHaveSkills: [{ type: String, lowercase: true, trim: true }],

    stipend:   StipendSchema,
    location:  String,
    mode:      { type: String, enum: ['remote', 'onsite', 'hybrid'], required: true },
    duration:  String, // "2 months", "6 months"
    eligibility: String,
    openings:  { type: Number, default: 1, min: 1 },
    applyLink: { type: String, required: true },
    deadline:  Date,

    isActive: { type: Boolean, default: true, index: true },
    domain:   [{ type: String, lowercase: true }],

    // Semantic embedding for vector search
    embedding: { type: [Number], select: false },

    // Who posted it (null = admin-seeded)
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    applicationCount: { type: Number, default: 0, min: 0 },
    viewCount:        { type: Number, default: 0,  min: 0 },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────
InternshipSchema.index({ requiredSkills: 1 });
InternshipSchema.index({ isActive: 1, createdAt: -1 });
InternshipSchema.index({ company: 'text', title: 'text', description: 'text' });
InternshipSchema.index({ domain: 1, mode: 1 });
InternshipSchema.index({ deadline: 1 }, { sparse: true });

const Internship = mongoose.model('Internship', InternshipSchema);
export default Internship;
