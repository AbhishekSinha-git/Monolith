"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiMcpService = void 0;
const ws_1 = require("ws");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Fi MCP (Model Context Protocol) Service
 * Connects to Fi Money's MCP Server to fetch structured financial data across 18+ sources
 * including assets, liabilities, net worth, credit scores, EPF, and more.
 *
 * This is the world's first consumer-facing personal finance MCP Server integration
 * enabling AI-native infrastructure for personalized financial insights.
 */
class FiMcpService {
    constructor() {
        this.userData = new Map();
        this.credentials = new Map();
        this.connections = new Map();
        this.streamEventHandlers = new Map();
        // Initialize Fi MCP Server configuration
        this.config = {
            serverUrl: process.env.FI_MCP_SERVER_URL || 'https://api.fimoney.com',
            authEndpoint: process.env.FI_MCP_AUTH_ENDPOINT || 'https://auth.fimoney.com/oauth/authorize',
            streamEndpoint: process.env.FI_MCP_STREAM_ENDPOINT || 'wss://stream.fimoney.com/mcp',
            clientId: process.env.FI_MCP_CLIENT_ID || '',
            clientSecret: process.env.FI_MCP_CLIENT_SECRET || '',
            redirectUri: process.env.FI_MCP_REDIRECT_URI || 'http://localhost:3001/api/mcp/callback',
            scopes: [
                'read:assets',
                'read:liabilities',
                'read:accounts',
                'read:transactions',
                'read:portfolio',
                'read:credit_score',
                'read:epf',
                'read:nps',
                'read:investments',
                'read:insurance'
            ]
        };
        if (!this.config.clientId || !this.config.clientSecret) {
            console.warn('Fi MCP credentials not configured. Please set FI_MCP_CLIENT_ID and FI_MCP_CLIENT_SECRET environment variables.');
        }
    }
    /**
     * Generate authorization URL for Fi MCP OAuth flow
     */
    async initiateConnection(userId) {
        const state = crypto_1.default.randomBytes(32).toString('hex');
        const nonce = crypto_1.default.randomBytes(16).toString('hex');
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(' '),
            state: state,
            nonce: nonce,
            user_id: userId
        });
        return `${this.config.authEndpoint}?${params.toString()}`;
    }
    /**
     * Complete OAuth flow and establish Fi MCP connection
     */
    async completeConnection(userId, authCode) {
        try {
            // Exchange authorization code for access token
            const tokenResponse = await fetch(`${this.config.serverUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: authCode,
                    redirect_uri: this.config.redirectUri,
                    client_id: this.config.clientId
                })
            });
            if (!tokenResponse.ok) {
                throw new Error(`Fi MCP authentication failed: ${tokenResponse.statusText}`);
            }
            const tokenData = await tokenResponse.json();
            const credentials = {
                userId: userId,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
            };
            this.credentials.set(userId, credentials);
            // Initialize MCP stream connection
            await this.connectStream(userId, credentials);
            // Fetch initial user data
            await this.fetchUserData(userId, credentials);
        }
        catch (error) {
            console.error('Fi MCP connection error:', error);
            throw new Error('Failed to connect to Fi MCP Server');
        }
    }
    /**
     * Establish WebSocket stream connection to Fi MCP Server for real-time updates
     */
    async connectStream(userId, credentials) {
        try {
            const ws = new ws_1.WebSocket(this.config.streamEndpoint, {
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'X-User-ID': userId,
                    'X-Client-ID': this.config.clientId
                }
            });
            const connection = {
                userId,
                socket: ws,
                isActive: false,
                reconnectAttempts: 0,
                lastPing: new Date()
            };
            ws.on('open', () => {
                console.log(`Fi MCP stream connected for user ${userId}`);
                connection.isActive = true;
                connection.reconnectAttempts = 0;
                // Send initial subscription message
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    events: ['PORTFOLIO_UPDATE', 'ASSET_UPDATE', 'LIABILITY_UPDATE', 'ACCOUNT_UPDATE']
                }));
            });
            ws.on('message', (data) => {
                try {
                    const event = JSON.parse(data.toString());
                    this.handleStreamEvent(userId, event);
                }
                catch (error) {
                    console.error('Error parsing Fi MCP stream event:', error);
                }
            });
            ws.on('close', (code, reason) => {
                console.log(`Fi MCP stream disconnected for user ${userId}: ${code} ${reason}`);
                connection.isActive = false;
                // Attempt reconnection if not intentional
                if (code !== 1000 && connection.reconnectAttempts < 5) {
                    setTimeout(() => {
                        connection.reconnectAttempts++;
                        this.connectStream(userId, credentials);
                    }, Math.pow(2, connection.reconnectAttempts) * 1000);
                }
            });
            ws.on('error', (error) => {
                console.error(`Fi MCP stream error for user ${userId}:`, error);
                connection.isActive = false;
            });
            // Set up ping/pong for connection health
            const pingInterval = setInterval(() => {
                if (connection.isActive && ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.ping();
                    connection.lastPing = new Date();
                }
                else {
                    clearInterval(pingInterval);
                }
            }, 30000);
            ws.on('pong', () => {
                connection.lastPing = new Date();
            });
            this.connections.set(userId, connection);
        }
        catch (error) {
            console.error('Failed to establish Fi MCP stream connection:', error);
            throw new Error('Fi MCP stream connection failed');
        }
    }
    /**
     * Handle real-time events from Fi MCP Server
     */
    handleStreamEvent(userId, event) {
        console.log(`Fi MCP event for ${userId}:`, event.type);
        const handler = this.streamEventHandlers.get(userId);
        if (handler) {
            handler(event);
        }
        // Update local cache based on event type
        switch (event.type) {
            case 'PORTFOLIO_UPDATE':
                this.updatePortfolioData(userId, event.payload);
                break;
            case 'ASSET_UPDATE':
                this.updateAssetData(userId, event.payload);
                break;
            case 'LIABILITY_UPDATE':
                this.updateLiabilityData(userId, event.payload);
                break;
            case 'BANK_UPDATE':
                this.updateBankAccountData(userId, event.payload);
                break;
        }
    }
    /**
     * Update portfolio data from stream events
     */
    updatePortfolioData(userId, portfolioData) {
        const userData = this.userData.get(userId);
        if (userData) {
            userData.portfolio = portfolioData;
            userData.lastUpdated = new Date().toISOString();
            this.userData.set(userId, userData);
        }
    }
    /**
     * Update asset data from stream events
     */
    updateAssetData(userId, assetData) {
        const userData = this.userData.get(userId);
        if (userData) {
            userData.assets = assetData;
            userData.lastUpdated = new Date().toISOString();
            this.userData.set(userId, userData);
        }
    }
    /**
     * Update liability data from stream events
     */
    updateLiabilityData(userId, liabilityData) {
        const userData = this.userData.get(userId);
        if (userData) {
            userData.liabilities = liabilityData;
            userData.lastUpdated = new Date().toISOString();
            this.userData.set(userId, userData);
        }
    }
    /**
     * Update bank account data from stream events
     */
    updateBankAccountData(userId, accountData) {
        const userData = this.userData.get(userId);
        if (userData) {
            userData.bankAccounts = accountData;
            userData.lastUpdated = new Date().toISOString();
            this.userData.set(userId, userData);
        }
    }
    /**
     * Fetch comprehensive financial data from Fi MCP Server
     * This includes assets, liabilities, net worth, credit scores, EPF, and more across 18+ sources
     */
    async fetchUserData(userId, credentials) {
        try {
            const headers = {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Content-Type': 'application/json',
                'X-User-ID': userId
            };
            // Fetch all financial data in parallel from Fi MCP Server
            const [portfolioResponse, assetsResponse, liabilitiesResponse, accountsResponse] = await Promise.all([
                fetch(`${this.config.serverUrl}/api/v1/portfolio`, { headers }),
                fetch(`${this.config.serverUrl}/api/v1/assets`, { headers }),
                fetch(`${this.config.serverUrl}/api/v1/liabilities`, { headers }),
                fetch(`${this.config.serverUrl}/api/v1/accounts`, { headers })
            ]);
            if (!portfolioResponse.ok || !assetsResponse.ok || !liabilitiesResponse.ok || !accountsResponse.ok) {
                throw new Error('Failed to fetch financial data from Fi MCP Server');
            }
            const [portfolio, assets, liabilities, bankAccounts] = await Promise.all([
                portfolioResponse.json(),
                assetsResponse.json(),
                liabilitiesResponse.json(),
                accountsResponse.json()
            ]);
            const userData = {
                userId,
                portfolio: portfolio,
                assets: assets,
                liabilities: liabilities,
                bankAccounts: bankAccounts,
                lastUpdated: new Date().toISOString()
            };
            this.userData.set(userId, userData);
            return userData;
        }
        catch (error) {
            console.error('Error fetching Fi MCP user data:', error);
            throw new Error('Failed to fetch financial data from Fi MCP Server');
        }
    }
    /**
     * Get portfolio data from Fi MCP Server
     */
    async getPortfolio(userId) {
        const userData = this.userData.get(userId);
        if (!userData) {
            throw new Error('User not connected to Fi MCP Server. Please establish connection first.');
        }
        return userData.portfolio;
    }
    /**
     * Get assets from Fi MCP Server (Mutual Funds, Stocks, FDs, Real Estate, ESOP, EPF, NPS)
     */
    async getAssets(userId) {
        const userData = this.userData.get(userId);
        if (!userData) {
            throw new Error('User not connected to Fi MCP Server. Please establish connection first.');
        }
        return userData.assets;
    }
    /**
     * Get liabilities from Fi MCP Server (Home Loans, Personal Loans, Credit Cards)
     */
    async getLiabilities(userId) {
        const userData = this.userData.get(userId);
        if (!userData) {
            throw new Error('User not connected to Fi MCP Server. Please establish connection first.');
        }
        return userData.liabilities;
    }
    /**
     * Get bank accounts from Fi MCP Server
     */
    async getAccounts(userId) {
        const userData = this.userData.get(userId);
        if (!userData) {
            throw new Error('User not connected to Fi MCP Server. Please establish connection first.');
        }
        return userData.bankAccounts;
    }
    /**
     * Get transactions for financial analysis
     */
    async getTransactions(userId, limit = 100) {
        const credentials = this.credentials.get(userId);
        if (!credentials) {
            throw new Error('User not authenticated with Fi MCP Server');
        }
        try {
            const response = await fetch(`${this.config.serverUrl}/api/v1/transactions?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-User-ID': userId
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch transactions from Fi MCP Server');
            }
            return (await response.json());
        }
        catch (error) {
            console.error('Error fetching transactions:', error);
            throw new Error('Failed to fetch transaction data');
        }
    }
    /**
     * Get analytics and insights from Fi MCP Server
     */
    async getAnalytics(userId) {
        const credentials = this.credentials.get(userId);
        if (!credentials) {
            throw new Error('User not authenticated with Fi MCP Server');
        }
        try {
            const response = await fetch(`${this.config.serverUrl}/api/v1/analytics/spending`, {
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-User-ID': userId
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch analytics from Fi MCP Server');
            }
            return (await response.json());
        }
        catch (error) {
            console.error('Error fetching analytics:', error);
            throw new Error('Failed to fetch analytics data');
        }
    }
    /**
     * Get net worth history from Fi MCP Server
     */
    async getNetWorth(userId) {
        const credentials = this.credentials.get(userId);
        if (!credentials) {
            throw new Error('User not authenticated with Fi MCP Server');
        }
        try {
            const response = await fetch(`${this.config.serverUrl}/api/v1/networth/history`, {
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-User-ID': userId
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch net worth history from Fi MCP Server');
            }
            const data = (await response.json());
            return data.map((item) => ({
                date: item.date,
                amount: item.value.value
            }));
        }
        catch (error) {
            console.error('Error fetching net worth history:', error);
            throw new Error('Failed to fetch net worth data');
        }
    }
    /**
     * Get connection status for a user
     */
    async getConnectionStatus(userId) {
        const userData = this.userData.get(userId);
        const connection = this.connections.get(userId);
        return {
            isConnected: !!(userData && connection?.isActive),
            lastUpdated: userData?.lastUpdated
        };
    }
    /**
     * Refresh access token when expired
     */
    async refreshToken(credentials) {
        try {
            const response = await fetch(`${this.config.serverUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
                },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: credentials.refreshToken,
                    client_id: this.config.clientId
                })
            });
            if (!response.ok) {
                throw new Error('Token refresh failed');
            }
            const tokenData = await response.json();
            const newCredentials = {
                ...credentials,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
            };
            this.credentials.set(credentials.userId, newCredentials);
            return newCredentials;
        }
        catch (error) {
            console.error('Token refresh error:', error);
            throw new Error('Failed to refresh authentication token');
        }
    }
    /**
     * Disconnect from Fi MCP Server
     */
    async disconnect(userId) {
        const connection = this.connections.get(userId);
        if (connection && connection.socket) {
            connection.socket.close(1000, 'User disconnection');
        }
        this.connections.delete(userId);
        this.userData.delete(userId);
        this.credentials.delete(userId);
        this.streamEventHandlers.delete(userId);
    }
    /**
     * Subscribe to real-time events for a user
     */
    onStreamEvent(userId, handler) {
        this.streamEventHandlers.set(userId, handler);
    }
    /**
     * Check if user credentials are valid
     */
    isAuthenticated(userId) {
        const credentials = this.credentials.get(userId);
        return !!(credentials && credentials.expiresAt > new Date());
    }
    // Legacy compatibility methods
    async authenticate(code) {
        // This method is called from the OAuth callback
        // We need to determine the userId from the state parameter or session
        throw new Error('Use completeConnection instead');
    }
    async refreshConnection(userId) {
        const credentials = this.credentials.get(userId);
        if (!credentials) {
            throw new Error('No credentials found for user');
        }
        await this.refreshToken(credentials);
        await this.fetchUserData(userId, credentials);
    }
}
exports.FiMcpService = FiMcpService;
