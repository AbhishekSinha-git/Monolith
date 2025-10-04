import { Router } from 'express';
import {
  initializeFiMcp,
  authenticateUser,
  verifyPasscode,
  getAllFinancialData,
  getNetWorthHistory,
  getPortfolioPerformance,
  getUnderperformingInvestments,
  calculateAffordability,
  projectNetWorth,
  detectAnomalies,
  getConnectionStatus,
  processAIQuery
} from '../controllers/realFiMcpController';

const router = Router();

// Fi MCP Connection Routes
router.post('/initialize', initializeFiMcp);
router.get('/status', getConnectionStatus);

// Authentication Routes
router.post('/auth/phone', authenticateUser);
router.post('/auth/passcode', verifyPasscode);

// Financial Data Routes
router.get('/data/financial', getAllFinancialData);
router.get('/data/networth-history', getNetWorthHistory);
router.get('/data/portfolio-performance', getPortfolioPerformance);
router.get('/data/underperforming', getUnderperformingInvestments);

// Analysis Routes
router.post('/analysis/affordability', calculateAffordability);
router.post('/analysis/projection', projectNetWorth);
router.get('/analysis/anomalies', detectAnomalies);

// AI Query Processing
router.post('/ai/query', processAIQuery);

export { router as realFiMcpRoutes };