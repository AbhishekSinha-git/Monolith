import { Request, Response } from 'express';
import { FiMcpService } from '../services/mcpService';

// Extend Request interface for user property
interface ExtendedRequest extends Request {
  user?: {
    userId: string;
    id: string;
    email: string;
    name: string;
    [key: string]: any;
  };
}

// Custom error class for MCP operations
class McpError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public operationType?: string
  ) {
    super(message);
    this.name = 'McpError';
  }
}

// Type guard for error handling
const isMcpError = (error: any): error is McpError => {
  return error instanceof McpError;
};

// Helper function to validate user authentication
const validateUser = (req: ExtendedRequest): string => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new McpError('Unauthorized: User not authenticated', 401);
  }
  return userId;
};

// Helper function to get MCP service instance
const getMcpService = (req: ExtendedRequest): FiMcpService => {
  const mcpService = req.app.get('mcpService');
  if (!mcpService || !(mcpService instanceof FiMcpService)) {
    throw new McpError('MCP Service not properly initialized', 500);
  }
  return mcpService;
};

// Error handler wrapper
const handleMcpRequest = async (
  req: ExtendedRequest,
  res: Response,
  operation: (userId: string, service: FiMcpService) => Promise<any>,
  operationType: string
) => {
  try {
    const userId = validateUser(req);
    const mcpService = getMcpService(req);
    const result = await operation(userId, mcpService);
    res.status(200).json(result);
  } catch (error) {
    console.error(`Error in ${operationType}:`, error);
    if (isMcpError(error)) {
      res.status(error.statusCode).json({ 
        message: error.message,
        operation: operationType
      });
    } else {
      res.status(500).json({ 
        message: `Failed to ${operationType}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

export const getAccountsController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => await service.getAccounts(userId),
    'fetch accounts'
  );
};

export const getNetWorthController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => await service.getNetWorth(userId),
    'fetch net worth'
  );
};

export const getPortfolioController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => await service.getPortfolio(userId),
    'fetch portfolio'
  );
};

export const getTransactionsController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => {
      const limit = parseInt(req.query.limit as string) || 50;
      return await service.getTransactions(userId, limit);
    },
    'fetch transactions'
  );
};

export const getNetWorthHistoryController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => {
      return await service.getNetWorth(userId);
    },
    'fetch net worth history'
  );
};

export const getSpendingAnalysisController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => {
      return await service.getAnalytics(userId);
    },
    'fetch spending analysis'
  );
};

export const getInvestmentPerformanceController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => {
      return await service.getPortfolio(userId);
    },
    'fetch investment performance'
  );
};

export const getConnectionStatusController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => await service.getConnectionStatus(userId),
    'fetch connection status'
  );
};

export const initiateConnectionController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => {
      const redirectUrl = await service.initiateConnection(userId);
      return { redirectUrl };
    },
    'initiate Fi MCP connection'
  );
};

export const completeConnectionController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => {
      const { code } = req.body;
      if (!code) {
        throw new McpError('Missing connection code', 400);
      }
      await service.completeConnection(userId, code);
      return { message: 'Connection successful' };
    },
    'complete Fi MCP connection'
  );
};

export const refreshConnectionController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => {
      await service.refreshConnection(userId);
      return { message: 'Connection refreshed' };
    },
    'refresh Fi MCP connection'
  );
};

export const disconnectController = async (req: Request, res: Response) => {
  await handleMcpRequest(
    req as ExtendedRequest,
    res,
    async (userId, service) => {
      await service.disconnect(userId);
      return { message: 'Successfully disconnected' };
    },
    'disconnect Fi MCP'
  );
};