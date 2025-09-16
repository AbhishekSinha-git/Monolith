export type CurrencyAmount = {
  currency: string; // e.g., INR, USD
  value: number;
};

export type Asset = {
  id: string;
  type: 'bank_account' | 'investment' | 'epf' | 'other';
  institution: string;
  name: string;
  balance: CurrencyAmount;
  updatedAt: string;
};

export type Liability = {
  id: string;
  type: 'loan' | 'credit_card' | 'other';
  institution: string;
  name: string;
  outstanding: CurrencyAmount;
  rate?: number;
  dueDate?: string;
  updatedAt: string;
};

export type CreditScore = {
  provider: string;
  score: number;
  band: 'poor' | 'fair' | 'good' | 'excellent';
  lastUpdated: string;
};

export type NetWorthPoint = {
  timestamp: string;
  assets: number;
  liabilities: number;
  netWorth: number;
  currency: string;
};

export type EPF = {
  uanMasked: string;
  balance: CurrencyAmount;
  lastContributionDate?: string;
};

export type Consent = {
  id: string;
  scopes: string[];
  grantedAt: string;
  revokedAt?: string;
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


