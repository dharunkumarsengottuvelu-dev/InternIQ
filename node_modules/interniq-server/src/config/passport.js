import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const configurePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.warn('⚠️  Google OAuth not configured — GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google profile'), null);

          // Upsert: find existing user or create from Google profile
          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

          if (user) {
            // Link Google ID if user registered with email first
            if (!user.googleId) {
              user.googleId = profile.id;
              user.isEmailVerified = true;
              await user.save();
            }
          } else {
            user = await User.create({
              name:             profile.displayName,
              email,
              googleId:         profile.id,
              profileImage:     profile.photos?.[0]?.value,
              isEmailVerified:  true,
              role:             'student',
            });
          }

          return done(null, user);
        } catch (err) {
          logger.error(`❌ Google OAuth error: ${err.message}`);
          return done(err, null);
        }
      }
    )
  );

  // Stateless — we use JWT, so no session serialization needed
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

export default configurePassport;
