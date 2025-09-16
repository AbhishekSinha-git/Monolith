import { Router } from 'express';
import { getAccountsController, getNetWorthController } from '../controllers/mcpController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All routes in this file are protected
router.use(protect);

router.get('/accounts', getAccountsController);
router.get('/net-worth', getNetWorthController);

export default router;
