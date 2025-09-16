import { MCPData, Account, NetWorth } from '../types/mcp';

// This is mock data simulating what we'd get from Fi's MCP Server
const mockMCPData: MCPData = {
  accounts: [
    { id: 'acc_1', name: 'HDFC Savings', type: 'SAVINGS', balance: 150000, currency: 'INR' },
    { id: 'acc_2', name: 'ICICI Credit Card', type: 'CREDIT_CARD', balance: -25000, currency: 'INR' },
    { id: 'acc_3', name: 'Bajaj Home Loan', type: 'LOAN', balance: -5000000, currency: 'INR' },
    { id: 'acc_4', name: 'Zerodha Stocks', type: 'SAVINGS', balance: 750000, currency: 'INR' },
  ],
  netWorthHistory: [
    { date: '2025-01-01', amount: 5000000 },
    { date: '2025-02-01', amount: 5250000 },
    { date: '2025-03-01', amount: 5100000 },
    { date: '2025-04-01', amount: 5500000 },
    { date: '2025-05-01', amount: 5750000 },
  ],
};

export const getAccounts = async (): Promise<Account[]> => {
  // In a real app, this would be an authenticated API call to the MCP server
  return Promise.resolve(mockMCPData.accounts);
};

export const getNetWorth = async (): Promise<NetWorth[]> => {
  return Promise.resolve(mockMCPData.netWorthHistory);
};
