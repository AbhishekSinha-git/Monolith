import { Request, Response } from 'express';
import FiMcpService from '../services/mcpService';
import * as geminiService from '../services/geminiService';

// We'll use this type for the authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const handleChat = async (req: AuthenticatedRequest, res: Response) => {
  const { message } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const mcpService = req.app.get('mcpService') as FiMcpService;

    // 1. Fetch all financial data for the user
    const accounts = await mcpService.getAccounts(userId);
    const netWorthHistory = await mcpService.getNetWorth(userId);
    const financialData = { accounts, netWorthHistory };

    // 2. Get insights from the AI service
    const insight = await geminiService.getFinancialInsight(message, financialData);

    // 3. Send the response back to the client
    res.status(200).json({ reply: insight });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
};
