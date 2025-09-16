import { Request, Response } from 'express';
import * as mcpService from '../services/mcpService';
import * as geminiService from '../services/geminiService';

export const handleChat = async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Fetch all financial data for the user
    const accounts = await mcpService.getAccounts();
    const netWorthHistory = await mcpService.getNetWorth();
    const financialData = { accounts, netWorthHistory };

    // 2. Get insights from the AI service
    const insight = await geminiService.getFinancialInsight(message, financialData);

    // 3. Send the response back to the client
    res.status(200).json({ reply: insight });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
};
