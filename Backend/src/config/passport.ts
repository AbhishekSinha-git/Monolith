import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3001/api/auth/google/callback', // Must match the one in Google Console
      scope: ['email', 'profile'],
    },
    (accessToken, refreshToken, profile, done) => {
      // This function is called when Google successfully authenticates the user.
      // 'profile' contains the user's Google profile information.
      // In a real app, you would find or create a user in your database here.
      // For now, we'll just pass the profile straight through.
      return done(null, profile);
    }
  )
);
