"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mcpController_1 = require("../controllers/mcpController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes in this file are protected
router.use(authMiddleware_1.protect);
// Fi MCP Connection Management
// @ts-ignore
router.get('/status', mcpController_1.getConnectionStatusController);
// @ts-ignore  
router.post('/connect', mcpController_1.initiateConnectionController);
// @ts-ignore
router.post('/connect/callback', mcpController_1.completeConnectionController);
// @ts-ignore
router.post('/refresh', mcpController_1.refreshConnectionController);
// @ts-ignore
router.post('/disconnect', mcpController_1.disconnectController);
// Data Access
// @ts-ignore
router.get('/accounts', mcpController_1.getAccountsController);
// @ts-ignore
router.get('/portfolio', mcpController_1.getPortfolioController);
// @ts-ignore
router.get('/transactions', mcpController_1.getTransactionsController);
// Analytics  
// @ts-ignore
router.get('/analytics/net-worth', mcpController_1.getNetWorthHistoryController);
// @ts-ignore
router.get('/analytics/spending', mcpController_1.getSpendingAnalysisController);
// @ts-ignore
router.get('/analytics/investments', mcpController_1.getInvestmentPerformanceController);
exports.default = router;
