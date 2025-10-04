"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const googleCallback = (req, res) => {
    try {
        if (!req.user) {
            console.error('No user data received from Google');
            return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        }
        const user = req.user;
        // Create JWT token with all necessary user info
        const token = jsonwebtoken_1.default.sign({
            sub: user.id || user._json.sub, // Use Google's sub as fallback
            id: user.id || user._json.sub,
            email: user.emails?.[0]?.value || user._json.email,
            name: user.displayName || user._json.name,
            picture: user.photos?.[0]?.value || user._json.picture
        }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    }
    catch (error) {
        console.error('Auth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
};
exports.googleCallback = googleCallback;
