import { http } from '@/api/client';

export type MoneyValue = {
  currency: string;
  value: number;
};

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: MoneyValue;
  institution: string;
  lastUpdated: string;
};

export type AssetBreakdown = {
  mutualFunds: MoneyValue;
  stocks: MoneyValue;
  fixedDeposits: MoneyValue;
  realEstate: MoneyValue;
  esop: MoneyValue;
  epf: MoneyValue;
  nps: MoneyValue;
  cash: MoneyValue;
};

export type Portfolio = {
  netWorth: MoneyValue;
  assets: {
    total: MoneyValue;
    breakdown: AssetBreakdown;
  };
  liabilities: {
    total: MoneyValue;
    breakdown: {
      loans: MoneyValue;
      creditCards: MoneyValue;
    };
  };
};

export type Transaction = {
  id: string;
  amount: MoneyValue;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  date: string;
  account: string;
};

export type FiMcpConnectionStatus = {
  isConnected: boolean;
  institutions: {
    id: string;
    name: string;
    type: 'bank' | 'investment' | 'epf' | 'other';
    status: 'connected' | 'error' | 'syncing';
    lastSync?: string;
  }[];
};

export const mcpApi = {
  // Connection management
  getConnectionStatus: () => http.get<FiMcpConnectionStatus>('/api/mcp/status'),
  initiateConnection: () => http.post<{ redirectUrl: string }>('/api/mcp/connect'),
  completeConnection: (code: string) => http.post<void>('/api/mcp/connect/callback', { code }),
  refreshConnection: () => http.post<void>('/api/mcp/refresh'),
  disconnect: () => http.post<void>('/api/mcp/disconnect'),

  // Account and portfolio data
  getAccounts: () => http.get<Account[]>('/api/mcp/accounts'),
  getPortfolio: () => http.get<Portfolio>('/api/mcp/portfolio'),
  
  // Transaction data
  getTransactions: (params?: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
    category?: string;
    limit?: number;
  }) => http.get<Transaction[]>('/api/mcp/transactions', { params }),
  
  // Analytics
  getNetWorthHistory: (period: 'month' | 'quarter' | 'year') => 
    http.get<Array<{ date: string; netWorth: MoneyValue }>>('/api/mcp/analytics/net-worth', { 
      params: { period } 
    }),
  
  getSpendingAnalysis: (period: 'month' | 'quarter' | 'year') => 
    http.get<Array<{ category: string; total: MoneyValue }>>('/api/mcp/analytics/spending', { 
      params: { period } 
    }),
  
  getInvestmentPerformance: (period: 'month' | 'quarter' | 'year') => 
    http.get<{
      overall: { return: number; change: MoneyValue };
      breakdown: Array<{ 
        type: string;
        return: number;
        change: MoneyValue;
      }>;
    }>('/api/mcp/analytics/investments', { 
      params: { period } 
    }),
};