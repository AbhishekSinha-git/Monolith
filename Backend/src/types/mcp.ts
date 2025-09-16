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
