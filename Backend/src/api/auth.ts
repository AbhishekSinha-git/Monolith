import { Router } from 'express';
import passport from 'passport';
import { googleCallback } from '../controllers/authController';
import jwt from 'jsonwebtoken';

const router = Router();

// Route to start the Google OAuth flow
// The 'scope' tells Google what information we are requesting
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// The callback route that Google redirects to after authentication
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleCallback
);

// Simple session endpoint to validate token and return user info
router.get('/session', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ isAuthenticated: false, user: null });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return res.json({ isAuthenticated: true, user: payload });
  } catch (e) {
    return res.status(401).json({ isAuthenticated: false, user: null });
  }
});

export default router;
