// Common Types
export type CurrencyAmount = {
  currency: string; // e.g., INR, USD
  value: number;
};

// Fi MCP Asset Types
export type FiMcpAssetType = 'MUTUAL_FUND' | 'INDIAN_STOCK' | 'US_STOCK' | 'FD' | 'REAL_ESTATE' | 'ESOP' | 'EPF' | 'NPS';

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

// Fi MCP Liability Types
export type FiMcpLiabilityType = 'HOME_LOAN' | 'PERSONAL_LOAN' | 'CREDIT_CARD' | 'OTHER';

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

// Fi MCP Bank Account Types
export interface FiMcpBankAccount {
  id: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  balance: CurrencyAmount;
  lastUpdated: string;
  metadata: Record<string, any>;
}

// Fi MCP Portfolio Performance
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

// Fi MCP Connection Status
export interface FiMcpConnectionStatus {
  isConnected: boolean;
  lastSynced: string | null;
  error: string | null;
  passcodeExpiry?: string;
}

// Fi MCP Authentication
export interface FiMcpAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  passcode?: string;
}

// Fi MCP Stream Events
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

// Existing types for backward compatibility
export type Asset = FiMcpAsset;
export type Liability = FiMcpLiability;

export type CreditScore = {
  provider: string;
  score: number;
  band: 'poor' | 'fair' | 'good' | 'excellent';
  lastUpdated: string;
};

export type Insight = {
  id: string;
  title: string;
  description: string;
  category: 'Spending' | 'Budget' | 'Investments' | 'Savings' | 'Credit' | 'Risk';
  impact?: string;
  severity?: 'low' | 'medium' | 'high';
  sources?: Array<{ type: string; id: string; asOf?: string }>;
  createdAt: string;
};


