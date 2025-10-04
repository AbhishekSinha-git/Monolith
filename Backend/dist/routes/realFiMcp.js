"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realFiMcpRoutes = void 0;
const express_1 = require("express");
const realFiMcpController_1 = require("../controllers/realFiMcpController");
const router = (0, express_1.Router)();
exports.realFiMcpRoutes = router;
// Fi MCP Connection Routes
router.post('/initialize', realFiMcpController_1.initializeFiMcp);
router.get('/status', realFiMcpController_1.getConnectionStatus);
// Authentication Routes
router.post('/auth/phone', realFiMcpController_1.authenticateUser);
router.post('/auth/passcode', realFiMcpController_1.verifyPasscode);
// Financial Data Routes
router.get('/data/financial', realFiMcpController_1.getFinancialData);
router.get('/data/networth-history', realFiMcpController_1.getNetWorthHistory);
router.get('/data/portfolio-performance', realFiMcpController_1.getPortfolioPerformance);
router.get('/data/underperforming', realFiMcpController_1.getUnderperformingInvestments);
// Analysis Routes
router.post('/analysis/affordability', realFiMcpController_1.calculateAffordability);
router.post('/analysis/projection', realFiMcpController_1.projectNetWorth);
router.get('/analysis/anomalies', realFiMcpController_1.detectAnomalies);
// AI Query Processing
router.post('/ai/query', realFiMcpController_1.processAIQuery);
