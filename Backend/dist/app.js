"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const auth_1 = __importDefault(require("./api/auth"));
const mcp_1 = __importDefault(require("./api/mcp"));
const chat_1 = __importDefault(require("./api/chat"));
const realFiMcp_1 = require("./routes/realFiMcp");
const mcpService_1 = require("./services/mcpService");
require("./config/passport"); // Import to initialize passport configuration
const app = (0, express_1.default)();
// Initialize MCP Service
const mcpConfig = {
    serverUrl: process.env.FI_MCP_SERVER_URL || 'https://api.fi.money',
    clientId: process.env.FI_MCP_CLIENT_ID || 'mock-client-id',
    clientSecret: process.env.FI_MCP_CLIENT_SECRET || 'mock-client-secret',
    authEndpoint: process.env.FI_MCP_AUTH_ENDPOINT || 'https://api.fi.money/oauth/authorize',
    streamEndpoint: process.env.FI_MCP_STREAM_ENDPOINT || 'wss://api.fi.money/stream',
    redirectUri: process.env.FI_MCP_REDIRECT_URI || 'http://localhost:3001/api/mcp/callback',
    scopes: ['read_accounts', 'read_transactions', 'read_portfolio']
};
const mcpService = new mcpService_1.FiMcpService();
app.set('mcpService', mcpService);
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Initialize authentication
app.use(passport_1.default.initialize());
// A simple health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', mcpServiceInitialized: !!app.get('mcpService') });
});
// Use the authentication routes
app.use('/api/auth', auth_1.default);
// Use the legacy MCP routes (for backward compatibility)
app.use('/api/mcp', mcp_1.default);
// Use the Real Fi MCP routes (new implementation)
app.use('/api/fi-mcp', realFiMcp_1.realFiMcpRoutes);
// Use the Chat routes
app.use('/api/chat', chat_1.default);
module.exports = app;
