"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Attach user to the request object with consistent userId field
            req.user = {
                userId: decoded.sub || decoded.id || decoded.userId,
                id: decoded.sub || decoded.id || decoded.userId,
                email: decoded.email,
                name: decoded.name,
                ...decoded
            };
            console.log('Auth middleware: User authenticated:', req.user?.userId);
            next();
        }
        catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};
exports.protect = protect;
