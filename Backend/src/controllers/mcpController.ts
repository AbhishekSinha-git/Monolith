import { Request, Response } from 'express';
import * as mcpService from '../services/mcpService';

export const getAccountsController = async (req: Request, res: Response) => {
  try {
    const accounts = await mcpService.getAccounts();
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch accounts' });
  }
};

export const getNetWorthController = async (req: Request, res: Response) => {
  try {
    const netWorth = await mcpService.getNetWorth();
    res.status(200).json(netWorth);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch net worth' });
  }
};
