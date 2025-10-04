"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Route to start the Google OAuth flow
// The 'scope' tells Google what information we are requesting
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
// The callback route that Google redirects to after authentication
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login', session: false }), authController_1.googleCallback);
// Simple session endpoint to validate token and return user info
router.get('/session', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ isAuthenticated: false, user: null });
    }
    const token = auth.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return res.json({ isAuthenticated: true, user: payload });
    }
    catch (e) {
        return res.status(401).json({ isAuthenticated: false, user: null });
    }
});
exports.default = router;
