/**
 * Real Fi MCP API Client
 * Connects to the actual Fi MCP Server endpoint following the problem statement specifications
 */

const API_BASE_URL = 'http://localhost:3001/api/fi-mcp';

interface FiMcpResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

interface FiMcpAuthResponse {
  status: 'pending' | 'authenticated' | 'failed';
  loginUrl?: string;
  passcode?: string;
  token?: string;
}

interface FiMcpConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  lastUpdate?: Date;
  message?: string;
}

interface FiMcpFinancialData {
  netWorth: {
    current: number;
    currency: string;
    lastUpdated: string;
  };
  assets: {
    mutualFunds: Array<{
      name: string;
      value: number;
      units: number;
      nav: number;
      cagr?: number;
      performance?: 'outperforming' | 'underperforming' | 'neutral';
    }>;
    stocks: {
      indian: Array<{
        symbol: string;
        quantity: number;
        currentValue: number;
        investedValue: number;
        pnl: number;
      }>;
      us: Array<{
        symbol: string;
        quantity: number;
        currentValue: number;
        investedValue: number;
        pnl: number;
      }>;
    };
    fixedDeposits: Array<{
      bank: string;
      amount: number;
      interestRate: number;
      maturityDate: string;
    }>;
    realEstate: Array<{
      type: string;
      location: string;
      currentValue: number;
      purchaseValue: number;
    }>;
    esops: Array<{
      company: string;
      unvestedShares: number;
      vestedShares: number;
      currentValue: number;
    }>;
    cash: {
      bankBalances: Array<{
        bankName: string;
        accountType: string;
        balance: number;
      }>;
    };
  };
  liabilities: {
    loans: Array<{
      type: 'home' | 'personal' | 'car' | 'education';
      bank: string;
      outstandingAmount: number;
      emi: number;
      interestRate: number;
      tenure: number;
    }>;
    creditCards: Array<{
      bank: string;
      outstandingAmount: number;
      creditLimit: number;
      dueDate: string;
      minimumDue: number;
    }>;
  };
  government: {
    epf: {
      balance: number;
      employeeContribution: number;
      employerContribution: number;
      lastUpdated: string;
    };
    nps: {
      balance: number;
      tierI: number;
      tierII: number;
      lastUpdated: string;
    };
  };
  creditScore: {
    score: number;
    bureau: string;
    lastUpdated: string;
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
  };
  performance: {
    portfolioReturns: {
      cagr: number;
      xirr: number;
      ytd: number;
    };
    assetAllocation: {
      equity: number;
      debt: number;
      cash: number;
      others: number;
    };
  };
}

interface NetWorthHistoryItem {
  date: string;
  netWorth: number;
  breakdown: {
    assets: number;
    liabilities: number;
  };
}

interface PortfolioPerformance {
  cagr: number;
  xirr: number;
  ytd: number;
  assetWiseReturns: Array<{
    assetType: string;
    returns: number;
    performance: 'outperforming' | 'underperforming' | 'neutral';
  }>;
}

interface UnderperformingInvestment {
  name: string;
  type: 'mutual_fund' | 'stock' | 'fd';
  currentValue: number;
  returns: number;
  benchmark: string;
  underperformance: number;
  recommendation: string;
}

interface AffordabilityAnalysis {
  affordable: boolean;
  maxAffordableLoan: number;
  estimatedEmi: number;
  debtToIncomeRatio: number;
  recommendation: string;
}

interface NetWorthProjection {
  projectedNetWorth: number;
  requiredMonthlyInvestment: number;
  assumptions: {
    annualReturn: number;
    inflationRate: number;
  };
  milestones: Array<{
    age: number;
    netWorth: number;
  }>;
}

interface FinancialAnomaly {
  type: 'expense_spike' | 'idle_cash' | 'high_interest' | 'concentration_risk';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  recommendation: string;
  amount?: number;
}

interface AIQueryResponse {
  response: string;
  financialContext: {
    netWorth: number;
    portfolioReturns: {
      cagr: number;
      xirr: number;
      ytd: number;
    };
    creditScore: number;
  };
}

class RealFiMcpApi {
  /**
   * Initialize Fi MCP connection
   */
  async initialize(): Promise<FiMcpResponse<FiMcpConnectionStatus>> {
    try {
      const response = await fetch(`${API_BASE_URL}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error initializing Fi MCP:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<FiMcpResponse<FiMcpConnectionStatus>> {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting connection status:', error);
      throw error;
    }
  }

  /**
   * Start authentication with phone number
   */
  async authenticateWithPhone(phoneNumber: string): Promise<FiMcpResponse<FiMcpAuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error authenticating with phone:', error);
      throw error;
    }
  }

  /**
   * Verify passcode from Fi Money app
   */
  async verifyPasscode(phoneNumber: string, passcode: string): Promise<FiMcpResponse<FiMcpAuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/passcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, passcode }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error verifying passcode:', error);
      throw error;
    }
  }

  /**
   * Get complete financial data
   */
  async getFinancialData(): Promise<FiMcpResponse<FiMcpFinancialData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/financial`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting financial data:', error);
      throw error;
    }
  }

  /**
   * Get net worth history
   */
  async getNetWorthHistory(period: '1m' | '3m' | '6m' | '1y' = '6m'): Promise<FiMcpResponse<NetWorthHistoryItem[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/networth-history?period=${period}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting net worth history:', error);
      throw error;
    }
  }

  /**
   * Get portfolio performance
   */
  async getPortfolioPerformance(): Promise<FiMcpResponse<PortfolioPerformance>> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/portfolio-performance`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting portfolio performance:', error);
      throw error;
    }
  }

  /**
   * Get underperforming investments
   */
  async getUnderperformingInvestments(): Promise<FiMcpResponse<UnderperformingInvestment[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/underperforming`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting underperforming investments:', error);
      throw error;
    }
  }

  /**
   * Calculate loan affordability
   */
  async calculateAffordability(loanAmount: number, loanType: 'home' | 'personal' | 'car'): Promise<FiMcpResponse<AffordabilityAnalysis>> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/affordability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loanAmount, loanType }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error calculating affordability:', error);
      throw error;
    }
  }

  /**
   * Project net worth
   */
  async projectNetWorth(targetAge: number, currentAge: number, monthlyInvestment?: number): Promise<FiMcpResponse<NetWorthProjection>> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/projection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetAge, currentAge, monthlyInvestment }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error projecting net worth:', error);
      throw error;
    }
  }

  /**
   * Detect financial anomalies
   */
  async detectAnomalies(): Promise<FiMcpResponse<FinancialAnomaly[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/anomalies`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error detecting anomalies:', error);
      throw error;
    }
  }

  /**
   * Process AI query with Fi MCP data
   */
  async processAIQuery(query: string): Promise<FiMcpResponse<AIQueryResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error processing AI query:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realFiMcpApi = new RealFiMcpApi();

// Export types
export type {
  FiMcpResponse,
  FiMcpAuthResponse,
  FiMcpConnectionStatus,
  FiMcpFinancialData,
  NetWorthHistoryItem,
  PortfolioPerformance,
  UnderperformingInvestment,
  AffordabilityAnalysis,
  NetWorthProjection,
  FinancialAnomaly,
  AIQueryResponse
};