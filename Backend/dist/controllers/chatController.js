"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChat = void 0;
const geminiService = __importStar(require("../services/geminiService"));
const handleChat = async (req, res) => {
    const { message } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    try {
        const mcpService = req.app.get('mcpService');
        // 1. Fetch all financial data for the user
        const fiAccounts = await mcpService.getAccounts(userId);
        const fiNetWorthHistory = await mcpService.getNetWorth(userId);
        // 2. Transform Fi MCP data to legacy format for Gemini service
        const accounts = fiAccounts.map(account => ({
            id: account.id,
            name: account.bankName,
            type: account.accountType === 'SAVINGS' ? 'SAVINGS' :
                account.accountType === 'CURRENT' ? 'SAVINGS' : 'SAVINGS',
            balance: account.balance.value,
            currency: 'INR'
        }));
        const netWorthHistory = fiNetWorthHistory.map(item => ({
            date: item.date,
            amount: item.amount
        }));
        const financialData = { accounts, netWorthHistory };
        // 3. Get insights from the AI service
        const insight = await geminiService.getFinancialInsight(message, financialData);
        // 3. Send the response back to the client
        res.status(200).json({ reply: insight });
    }
    catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ error: 'Failed to process chat message.' });
    }
};
exports.handleChat = handleChat;
