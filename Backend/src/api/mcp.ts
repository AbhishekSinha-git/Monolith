import { Router } from 'express';
import { 
  getAccountsController, 
  getNetWorthController,
  getPortfolioController,
  getTransactionsController,
  getNetWorthHistoryController,
  getSpendingAnalysisController,
  getInvestmentPerformanceController,
  initiateConnectionController,
  completeConnectionController,
  getConnectionStatusController,
  refreshConnectionController,
  disconnectController
} from '../controllers/mcpController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All routes in this file are protected
router.use(protect);

// Fi MCP Connection Management
// @ts-ignore
router.get('/status', getConnectionStatusController);
// @ts-ignore  
router.post('/connect', initiateConnectionController);
// @ts-ignore
router.post('/connect/callback', completeConnectionController);
// @ts-ignore
router.post('/refresh', refreshConnectionController);
// @ts-ignore
router.post('/disconnect', disconnectController);

// Data Access
// @ts-ignore
router.get('/accounts', getAccountsController);
// @ts-ignore
router.get('/portfolio', getPortfolioController);
// @ts-ignore
router.get('/transactions', getTransactionsController);

// Analytics  
// @ts-ignore
router.get('/analytics/net-worth', getNetWorthHistoryController);
// @ts-ignore
router.get('/analytics/spending', getSpendingAnalysisController);
// @ts-ignore
router.get('/analytics/investments', getInvestmentPerformanceController);

export default router;
