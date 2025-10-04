import { Router } from 'express';
import { handleChat } from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// This is the endpoint our frontend will call for chat
// @ts-ignore
router.post('/', protect, handleChat);

export default router;
