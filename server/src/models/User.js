import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const PreferencesSchema = new Schema({
  domain:             [String],
  location:           String,
  internshipType:     { type: String, enum: ['remote', 'onsite', 'hybrid', 'any'], default: 'any' },
  preferredLanguages: [String],
}, { _id: false });

const UserSchema = new Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, select: false, minlength: 8 },
    googleId: { type: String, sparse: true },
    role:     { type: String, enum: ['student', 'admin', 'recruiter'], default: 'student' },

    isEmailVerified: { type: Boolean, default: false },
    isBlocked:       { type: Boolean, default: false },

    phone:        { type: String, trim: true },
    profileImage: String,

    // ─── Resume ─────────────────────────────────────────────
    resumeUrl:      String,
    resumePublicId: String, // Cloudinary public_id for deletion
    parsedResume:   { type: Schema.Types.Mixed }, // flexible structured data from LLM

    // ─── Scores ─────────────────────────────────────────────
    atsScore:     { type: Number, min: 0, max: 100, default: null },
    mcqScore:     { type: Number, min: 0, max: 100, default: null },
    codingScore:  { type: Number, min: 0, max: 100, default: null },
    overallScore: { type: Number, min: 0, max: 100, default: null },

    // ─── Skills (flattened from parsedResume for fast querying) ──
    skills: [{ type: String, lowercase: true }],

    // ─── Preferences ────────────────────────────────────────
    preferences: { type: PreferencesSchema, default: () => ({}) },

    // ─── Vectors (for Atlas Vector Search) ──────────────────
    profileEmbedding: { type: [Number], select: false },

    // ─── Auth Tokens ────────────────────────────────────────
    refreshToken:           { type: String, select: false },
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    passwordResetToken:     String,
    passwordResetExpiry:    Date,

    // ─── Brute-force protection (stored in Redis, but mirrored) ─
    loginAttempts: { type: Number, default: 0 },
    lockUntil:     Date,

    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.profileEmbedding;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
UserSchema.index({ overallScore: -1 });
UserSchema.index({ 'skills': 1 });
UserSchema.index({ role: 1, isBlocked: 1 });
UserSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────────────────────
UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.virtual('isProfileComplete').get(function () {
  return !!(this.resumeUrl && this.parsedResume);
});

// ─── Pre-save Hooks ───────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.calculateOverallScore = function () {
  const { atsScore, mcqScore, codingScore } = this;
  if (atsScore == null && mcqScore == null && codingScore == null) return null;
  const a = atsScore ?? 0;
  const m = mcqScore ?? 0;
  const c = codingScore ?? 0;
  return Math.round(a * 0.3 + m * 0.3 + c * 0.4);
};

const User = mongoose.model('User', UserSchema);
export default User;
