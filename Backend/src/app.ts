import express, { Request, Response } from 'express';
import cors from 'cors';
import passport from 'passport';
import authRoutes from './api/auth';
import mcpRoutes from './api/mcp';
import chatRoutes from './api/chat';
import { realFiMcpRoutes } from './routes/realFiMcp';
import { FiMcpService } from './services/mcpService';
import { FiMcpConfig } from './types/mcp';
import './config/passport'; // Import to initialize passport configuration

const app = express();

// Initialize MCP Service
const mcpConfig: FiMcpConfig = {
  serverUrl: process.env.FI_MCP_SERVER_URL || 'https://api.fi.money',
  clientId: process.env.FI_MCP_CLIENT_ID || 'mock-client-id',
  clientSecret: process.env.FI_MCP_CLIENT_SECRET || 'mock-client-secret',
  authEndpoint: process.env.FI_MCP_AUTH_ENDPOINT || 'https://api.fi.money/oauth/authorize',
  streamEndpoint: process.env.FI_MCP_STREAM_ENDPOINT || 'wss://api.fi.money/stream',
  redirectUri: process.env.FI_MCP_REDIRECT_URI || 'http://localhost:3001/api/mcp/callback',
  scopes: ['read_accounts', 'read_transactions', 'read_portfolio']
};

const mcpService = new FiMcpService();
app.set('mcpService', mcpService);

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
  res.status(200).json({ status: 'UP', mcpServiceInitialized: !!app.get('mcpService') });
});

// Use the authentication routes
app.use('/api/auth', authRoutes);

// Use the legacy MCP routes (for backward compatibility)
app.use('/api/mcp', mcpRoutes);

// Use the Real Fi MCP routes (new implementation)
app.use('/api/fi-mcp', realFiMcpRoutes);

// Use the Chat routes
app.use('/api/chat', chatRoutes);

module.exports = app;
