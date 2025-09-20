import { Request, Response } from 'express';
import FiMcpService from '../services/mcpService';

export const getAccountsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    
    const mcpService = req.app.get('mcpService') as FiMcpService;
    const accounts = await mcpService.getAccounts(userId);
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Failed to fetch accounts' });
  }
};

export const getNetWorthController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }

    const mcpService = req.app.get('mcpService') as FiMcpService;
    const netWorth = await mcpService.getNetWorth(userId);
    res.status(200).json(netWorth);
  } catch (error) {
    console.error('Error fetching net worth:', error);
    res.status(500).json({ message: 'Failed to fetch net worth' });
  }
};
