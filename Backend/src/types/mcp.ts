// Fi MCP Connection Types
export interface FiMcpConfig {
  serverUrl: string;
  authEndpoint: string;
  streamEndpoint: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface FiMcpCredentials {
  userId: string;
  accessToken: string;
  refreshToken: string;
  passcode?: string;
  expiresAt: Date;
}

// Fi MCP Stream Handling
export interface FiMcpStreamOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

import { WebSocket } from 'ws';

export interface FiMcpStreamConnection {
  userId: string;
  socket: WebSocket;
  lastPing?: Date;
  reconnectAttempts: number;
  isActive: boolean;
}

// Fi MCP Response Types
export type CurrencyAmount = {
  currency: string;
  value: number;
};

export type FiMcpAssetType = 'MUTUAL_FUND' | 'INDIAN_STOCK' | 'US_STOCK' | 'FD' | 'REAL_ESTATE' | 'ESOP' | 'EPF' | 'NPS';
export type FiMcpLiabilityType = 'HOME_LOAN' | 'PERSONAL_LOAN' | 'CREDIT_CARD' | 'OTHER';
export type FiMcpAccountType = 'SAVINGS' | 'CURRENT';

export interface FiMcpAsset {
  id: string;
  type: FiMcpAssetType;
  name: string;
  value: CurrencyAmount;
  returns?: {
    cagr?: number;
    xirr?: number;
    ytd?: number;
  };
  purchaseDate?: string;
  lastUpdated: string;
  metadata: Record<string, any>;
}

export interface FiMcpLiability {
  id: string;
  type: FiMcpLiabilityType;
  name: string;
  amount: CurrencyAmount;
  interestRate?: number;
  dueDate?: string;
  minimumPayment?: CurrencyAmount;
  lastUpdated: string;
  metadata: Record<string, any>;
}

export interface FiMcpBankAccount {
  id: string;
  bankName: string;
  accountType: FiMcpAccountType;
  balance: CurrencyAmount;
  lastUpdated: string;
  metadata: Record<string, any>;
}

export interface FiMcpPortfolio {
  netWorth: CurrencyAmount;
  assets: {
    total: CurrencyAmount;
    breakdown: {
      mutualFunds: CurrencyAmount;
      stocks: CurrencyAmount;
      fixedDeposits: CurrencyAmount;
      realEstate: CurrencyAmount;
      esop: CurrencyAmount;
      epf: CurrencyAmount;
      nps: CurrencyAmount;
      cash: CurrencyAmount;
    };
  };
  liabilities: {
    total: CurrencyAmount;
    breakdown: {
      loans: CurrencyAmount;
      creditCards: CurrencyAmount;
    };
  };
  returns: {
    cagr?: number;
    xirr?: number;
    ytd?: number;
  };
  lastUpdated: string;
}

// Fi MCP Event Types
export type FiMcpEventType = 
  | 'ASSET_UPDATE' 
  | 'LIABILITY_UPDATE' 
  | 'BANK_UPDATE' 
  | 'PORTFOLIO_UPDATE'
  | 'CONNECTION_STATUS'
  | 'ERROR';

export interface FiMcpStreamEvent {
  type: FiMcpEventType;
  payload: any;
  timestamp: string;
}

// Fi MCP User Data Store
export interface FiMcpUserData {
  userId: string;
  assets: FiMcpAsset[];
  liabilities: FiMcpLiability[];
  bankAccounts: FiMcpBankAccount[];
  portfolio: FiMcpPortfolio;
  lastUpdated: string;
}

// Legacy types for backward compatibility
export interface Account {
  id: string;
  name: string;
  type: 'SAVINGS' | 'CREDIT_CARD' | 'LOAN';
  balance: number;
  currency: 'INR';
}

export interface NetWorth {
  date: string;
  amount: number;
}

export interface MCPData {
  accounts: Account[];
  netWorthHistory: NetWorth[];
}
