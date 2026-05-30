import mongoose from 'mongoose';

const { Schema } = mongoose;

const RecommendationSchema = new Schema(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User',       required: true, index: true },
    internshipId: { type: Schema.Types.ObjectId, ref: 'Internship', required: true },

    matchScore:    { type: Number, min: 0, max: 100 },
    recommendation:{
      type: String,
      enum: ['Strongly Recommended', 'Recommended', 'Stretch Goal'],
    },
    matchReason:       String,
    strengthAlignment: [String],
    skillGaps:         [String],
    estimatedReadiness:String,

    isApplied: { type: Boolean, default: false },
    isSaved:   { type: Boolean, default: false },
    appliedAt: Date,

    // Vector search metadata
    vectorScore:   Number, // raw cosine similarity
    generatedAt:   { type: Date, default: Date.now },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days TTL
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────
RecommendationSchema.index({ userId: 1, matchScore: -1 });
RecommendationSchema.index({ userId: 1, internshipId: 1 }, { unique: true });

// TTL index — auto-expire stale recommendations
RecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Recommendation = mongoose.model('Recommendation', RecommendationSchema);
export default Recommendation;
