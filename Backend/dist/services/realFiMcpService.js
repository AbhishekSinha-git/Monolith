"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealFiMcpService = void 0;
const ws_1 = require("ws");
class RealFiMcpService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.authToken = null;
        this.messageId = 0;
        this.pendingRequests = new Map();
        this.MCP_ENDPOINT = 'https://mcp.fi.money:8080/mcp/stream';
        this.AUTH_ENDPOINT = 'https://mcp.fi.money:8080/auth';
        console.log('🚀 Initializing Real Fi MCP Service');
    }
    /**
     * Initialize connection to Fi MCP Server
     */
    async initialize() {
        try {
            console.log('📡 Connecting to Fi MCP Server:', this.MCP_ENDPOINT);
            // Connect to Fi MCP WebSocket endpoint
            this.ws = new ws_1.WebSocket(this.MCP_ENDPOINT, {
                headers: {
                    'User-Agent': 'Fi-MCP-Client/1.0',
                    'Origin': 'http://localhost:3001'
                }
            });
            return new Promise((resolve, reject) => {
                if (!this.ws) {
                    reject(new Error('Failed to create WebSocket connection'));
                    return;
                }
                this.ws.on('open', () => {
                    console.log('✅ Connected to Fi MCP Server');
                    this.isConnected = true;
                    this.setupMessageHandlers();
                    resolve();
                });
                this.ws.on('error', (error) => {
                    console.error('❌ Fi MCP Connection Error:', error);
                    reject(error);
                });
                this.ws.on('close', () => {
                    console.log('🔌 Fi MCP Connection Closed');
                    this.isConnected = false;
                    this.scheduleReconnect();
                });
            });
        }
        catch (error) {
            console.error('❌ Failed to initialize Fi MCP Service:', error);
            throw error;
        }
    }
    /**
     * Setup message handlers for Fi MCP communication
     */
    setupMessageHandlers() {
        if (!this.ws)
            return;
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'response') {
                    const pending = this.pendingRequests.get(message.id);
                    if (pending) {
                        if (message.error) {
                            pending.reject(new Error(message.error.message || 'MCP Error'));
                        }
                        else {
                            pending.resolve(message.result);
                        }
                        this.pendingRequests.delete(message.id);
                    }
                }
                else if (message.type === 'notification') {
                    this.handleNotification(message);
                }
            }
            catch (error) {
                console.error('❌ Error parsing Fi MCP message:', error);
            }
        });
    }
    /**
     * Handle real-time notifications from Fi MCP
     */
    handleNotification(message) {
        console.log('📨 Fi MCP Notification:', message.method, message.params);
        // Handle different notification types
        switch (message.method) {
            case 'portfolio/updated':
                console.log('💰 Portfolio updated:', message.params);
                break;
            case 'transaction/new':
                console.log('💳 New transaction:', message.params);
                break;
            case 'networth/changed':
                console.log('📈 Net worth changed:', message.params);
                break;
            default:
                console.log('🔔 Unknown notification:', message.method);
        }
    }
    /**
     * Send a request to Fi MCP Server
     */
    async sendRequest(method, params) {
        if (!this.isConnected || !this.ws) {
            throw new Error('Not connected to Fi MCP Server');
        }
        const messageId = `req_${++this.messageId}`;
        const message = {
            id: messageId,
            type: 'request',
            method,
            params
        };
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(messageId, { resolve, reject });
            this.ws.send(JSON.stringify(message));
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(messageId)) {
                    this.pendingRequests.delete(messageId);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }
    /**
     * Authenticate with Fi MCP using phone number and passcode
     */
    async authenticateUser(phoneNumber) {
        try {
            console.log('🔐 Starting Fi MCP authentication for:', phoneNumber);
            // Step 1: Request authentication
            const authResult = await this.sendRequest('auth/request', {
                phoneNumber: phoneNumber
            });
            if (authResult.status === 'pending') {
                console.log('📱 Authentication pending. User needs to get passcode from Fi Money app');
                return {
                    status: 'pending',
                    loginUrl: authResult.loginUrl || `https://fi.money/auth?phone=${phoneNumber}`
                };
            }
            return authResult;
        }
        catch (error) {
            console.error('❌ Fi MCP Authentication Error:', error);
            return {
                status: 'failed'
            };
        }
    }
    /**
     * Complete authentication with passcode from Fi Money app
     */
    async verifyPasscode(phoneNumber, passcode) {
        try {
            console.log('🔑 Verifying passcode for:', phoneNumber);
            const result = await this.sendRequest('auth/verify', {
                phoneNumber,
                passcode
            });
            if (result.status === 'authenticated') {
                this.authToken = result.token;
                console.log('✅ Fi MCP Authentication successful');
            }
            return result;
        }
        catch (error) {
            console.error('❌ Passcode verification failed:', error);
            return {
                status: 'failed'
            };
        }
    }
    /**
     * Get complete financial data from Fi MCP
     */
    async getFinancialData() {
        if (!this.authToken) {
            throw new Error('Not authenticated. Please authenticate first.');
        }
        try {
            console.log('📊 Fetching financial data from Fi MCP...');
            const data = await this.sendRequest('data/financial', {
                token: this.authToken,
                includeAll: true
            });
            console.log('✅ Financial data received from Fi MCP');
            return data;
        }
        catch (error) {
            console.error('❌ Error fetching financial data:', error);
            throw error;
        }
    }
    /**
     * Get net worth history
     */
    async getNetWorthHistory(period = '6m') {
        if (!this.authToken) {
            throw new Error('Not authenticated');
        }
        try {
            const result = await this.sendRequest('data/networth-history', {
                token: this.authToken,
                period
            });
            return result.history || [];
        }
        catch (error) {
            console.error('❌ Error fetching net worth history:', error);
            throw error;
        }
    }
    /**
     * Get portfolio performance metrics
     */
    async getPortfolioPerformance() {
        if (!this.authToken) {
            throw new Error('Not authenticated');
        }
        try {
            const result = await this.sendRequest('data/portfolio-performance', {
                token: this.authToken
            });
            return result;
        }
        catch (error) {
            console.error('❌ Error fetching portfolio performance:', error);
            throw error;
        }
    }
    /**
     * Get underperforming investments
     */
    async getUnderperformingInvestments() {
        if (!this.authToken) {
            throw new Error('Not authenticated');
        }
        try {
            const result = await this.sendRequest('analysis/underperforming', {
                token: this.authToken
            });
            return result.underperformingAssets || [];
        }
        catch (error) {
            console.error('❌ Error fetching underperforming investments:', error);
            return [];
        }
    }
    /**
     * Calculate loan affordability
     */
    async calculateAffordability(loanAmount, loanType) {
        if (!this.authToken) {
            throw new Error('Not authenticated');
        }
        try {
            const result = await this.sendRequest('analysis/affordability', {
                token: this.authToken,
                loanAmount,
                loanType
            });
            return result;
        }
        catch (error) {
            console.error('❌ Error calculating affordability:', error);
            throw error;
        }
    }
    /**
     * Project future net worth
     */
    async projectNetWorth(targetAge, currentAge, monthlyInvestment) {
        if (!this.authToken) {
            throw new Error('Not authenticated');
        }
        try {
            const result = await this.sendRequest('analysis/projection', {
                token: this.authToken,
                targetAge,
                currentAge,
                monthlyInvestment
            });
            return result;
        }
        catch (error) {
            console.error('❌ Error projecting net worth:', error);
            throw error;
        }
    }
    /**
     * Detect financial anomalies
     */
    async detectAnomalies() {
        if (!this.authToken) {
            throw new Error('Not authenticated');
        }
        try {
            const result = await this.sendRequest('analysis/anomalies', {
                token: this.authToken
            });
            return result.anomalies || [];
        }
        catch (error) {
            console.error('❌ Error detecting anomalies:', error);
            return [];
        }
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            authenticated: !!this.authToken,
            lastUpdate: new Date()
        };
    }
    /**
     * Schedule reconnection if connection is lost
     */
    scheduleReconnect() {
        setTimeout(() => {
            if (!this.isConnected) {
                console.log('🔄 Attempting to reconnect to Fi MCP...');
                this.initialize().catch(console.error);
            }
        }, 5000);
    }
    /**
     * Cleanup connections
     */
    async disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.authToken = null;
        this.pendingRequests.clear();
    }
}
exports.RealFiMcpService = RealFiMcpService;
