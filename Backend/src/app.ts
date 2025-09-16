import express, { Request, Response } from 'express';
import cors from 'cors';
import passport from 'passport';
import authRoutes from './api/auth';
import './config/passport'; // Import to initialize passport configuration

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize authentication
app.use(passport.initialize());

// A simple health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

import mcpRoutes from './api/mcp';

// ... existing code in app.ts

// Use the authentication routes
app.use('/api/auth', authRoutes);

import chatRoutes from './api/chat';

// ... existing code in app.ts

// Use the MCP routes
app.use('/api/mcp', mcpRoutes);

// Use the Chat routes
app.use('/api/chat', chatRoutes);

module.exports = app;
