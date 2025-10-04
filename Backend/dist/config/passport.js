"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/api/auth/google/callback', // Must match the one in Google Console
    scope: ['email', 'profile'],
}, (accessToken, refreshToken, profile, done) => {
    // This function is called when Google successfully authenticates the user.
    // 'profile' contains the user's Google profile information.
    // In a real app, you would find or create a user in your database here.
    // For now, we'll just pass the profile straight through.
    return done(null, profile);
}));
