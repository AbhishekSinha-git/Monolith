"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectController = exports.refreshConnectionController = exports.completeConnectionController = exports.initiateConnectionController = exports.getConnectionStatusController = exports.getInvestmentPerformanceController = exports.getSpendingAnalysisController = exports.getNetWorthHistoryController = exports.getTransactionsController = exports.getPortfolioController = exports.getNetWorthController = exports.getAccountsController = void 0;
const mcpService_1 = require("../services/mcpService");
// Custom error class for MCP operations
class McpError extends Error {
    constructor(message, statusCode = 500, operationType) {
        super(message);
        this.statusCode = statusCode;
        this.operationType = operationType;
        this.name = 'McpError';
    }
}
// Type guard for error handling
const isMcpError = (error) => {
    return error instanceof McpError;
};
// Helper function to validate user authentication
const validateUser = (req) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new McpError('Unauthorized: User not authenticated', 401);
    }
    return userId;
};
// Helper function to get MCP service instance
const getMcpService = (req) => {
    const mcpService = req.app.get('mcpService');
    if (!mcpService || !(mcpService instanceof mcpService_1.FiMcpService)) {
        throw new McpError('MCP Service not properly initialized', 500);
    }
    return mcpService;
};
// Error handler wrapper
const handleMcpRequest = async (req, res, operation, operationType) => {
    try {
        const userId = validateUser(req);
        const mcpService = getMcpService(req);
        const result = await operation(userId, mcpService);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(`Error in ${operationType}:`, error);
        if (isMcpError(error)) {
            res.status(error.statusCode).json({
                message: error.message,
                operation: operationType
            });
        }
        else {
            res.status(500).json({
                message: `Failed to ${operationType}`,
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
const getAccountsController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => await service.getAccounts(userId), 'fetch accounts');
};
exports.getAccountsController = getAccountsController;
const getNetWorthController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => await service.getNetWorth(userId), 'fetch net worth');
};
exports.getNetWorthController = getNetWorthController;
const getPortfolioController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => await service.getPortfolio(userId), 'fetch portfolio');
};
exports.getPortfolioController = getPortfolioController;
const getTransactionsController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => {
        const limit = parseInt(req.query.limit) || 50;
        return await service.getTransactions(userId, limit);
    }, 'fetch transactions');
};
exports.getTransactionsController = getTransactionsController;
const getNetWorthHistoryController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => {
        return await service.getNetWorth(userId);
    }, 'fetch net worth history');
};
exports.getNetWorthHistoryController = getNetWorthHistoryController;
const getSpendingAnalysisController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => {
        return await service.getAnalytics(userId);
    }, 'fetch spending analysis');
};
exports.getSpendingAnalysisController = getSpendingAnalysisController;
const getInvestmentPerformanceController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => {
        return await service.getPortfolio(userId);
    }, 'fetch investment performance');
};
exports.getInvestmentPerformanceController = getInvestmentPerformanceController;
const getConnectionStatusController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => await service.getConnectionStatus(userId), 'fetch connection status');
};
exports.getConnectionStatusController = getConnectionStatusController;
const initiateConnectionController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => {
        const redirectUrl = await service.initiateConnection(userId);
        return { redirectUrl };
    }, 'initiate Fi MCP connection');
};
exports.initiateConnectionController = initiateConnectionController;
const completeConnectionController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => {
        const { code } = req.body;
        if (!code) {
            throw new McpError('Missing connection code', 400);
        }
        await service.completeConnection(userId, code);
        return { message: 'Connection successful' };
    }, 'complete Fi MCP connection');
};
exports.completeConnectionController = completeConnectionController;
const refreshConnectionController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => {
        await service.refreshConnection(userId);
        return { message: 'Connection refreshed' };
    }, 'refresh Fi MCP connection');
};
exports.refreshConnectionController = refreshConnectionController;
const disconnectController = async (req, res) => {
    await handleMcpRequest(req, res, async (userId, service) => {
        await service.disconnect(userId);
        return { message: 'Successfully disconnected' };
    }, 'disconnect Fi MCP');
};
exports.disconnectController = disconnectController;
