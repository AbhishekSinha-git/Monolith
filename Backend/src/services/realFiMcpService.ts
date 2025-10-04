import { WebSocket } from 'ws';
import crypto from 'crypto';

/**
 * Real Fi MCP Service
 * Implements the actual Fi MCP Server connection as described in the problem statement
 * Connects to https://mcp.fi.money:8080/mcp/stream for real-time financial data
 */

interface FiMcpMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface FiMcpAuthResponse {
  status: 'pending' | 'authenticated' | 'failed';
  loginUrl?: string;
  passcode?: string;
  token?: string;
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

export class RealFiMcpService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private authToken: string | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();
  
  private readonly MCP_ENDPOINT = 'https://mcp.fi.money:8080/mcp/stream';
  private readonly AUTH_ENDPOINT = 'https://mcp.fi.money:8080/auth';
  
  constructor() {
    console.log('🚀 Initializing Real Fi MCP Service');
  }

  /**
   * Initialize connection to Fi MCP Server
   */
  async initialize(): Promise<void> {
    try {
      console.log('📡 Connecting to Fi MCP Server:', this.MCP_ENDPOINT);
      
      // Connect to Fi MCP WebSocket endpoint
      this.ws = new WebSocket(this.MCP_ENDPOINT, {
        headers: {
          'User-Agent': 'Fi-MCP-Client/1.0',
          'Origin': 'http://localhost:3001'
        }
      });

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket connection'));
          return;
        }

        this.ws.on('open', () => {
          console.log('✅ Connected to Fi MCP Server');
          this.isConnected = true;
          this.setupMessageHandlers();
          resolve();
        });

        this.ws.on('error', (error) => {
          console.error('❌ Fi MCP Connection Error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('🔌 Fi MCP Connection Closed');
          this.isConnected = false;
          this.scheduleReconnect();
        });
      });
    } catch (error) {
      console.error('❌ Failed to initialize Fi MCP Service:', error);
      throw error;
    }
  }

  /**
   * Setup message handlers for Fi MCP communication
   */
  private setupMessageHandlers(): void {
    if (!this.ws) return;

    this.ws.on('message', (data: Buffer) => {
      try {
        const message: FiMcpMessage = JSON.parse(data.toString());
        
        if (message.type === 'response') {
          const pending = this.pendingRequests.get(message.id);
          if (pending) {
            if (message.error) {
              pending.reject(new Error(message.error.message || 'MCP Error'));
            } else {
              pending.resolve(message.result);
            }
            this.pendingRequests.delete(message.id);
          }
        } else if (message.type === 'notification') {
          this.handleNotification(message);
        }
      } catch (error) {
        console.error('❌ Error parsing Fi MCP message:', error);
      }
    });
  }

  /**
   * Handle real-time notifications from Fi MCP
   */
  private handleNotification(message: FiMcpMessage): void {
    console.log('📨 Fi MCP Notification:', message.method, message.params);
    
    // Handle different notification types
    switch (message.method) {
      case 'portfolio/updated':
        console.log('💰 Portfolio updated:', message.params);
        break;
      case 'transaction/new':
        console.log('💳 New transaction:', message.params);
        break;
      case 'networth/changed':
        console.log('📈 Net worth changed:', message.params);
        break;
      default:
        console.log('🔔 Unknown notification:', message.method);
    }
  }

  /**
   * Send a request to Fi MCP Server
   */
  private async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to Fi MCP Server');
    }

    const messageId = `req_${++this.messageId}`;
    const message: FiMcpMessage = {
      id: messageId,
      type: 'request',
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });
      
      this.ws!.send(JSON.stringify(message));
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Authenticate with Fi MCP using phone number and passcode
   */
  async authenticateUser(phoneNumber: string): Promise<FiMcpAuthResponse> {
    try {
      console.log('🔐 Starting Fi MCP authentication for:', phoneNumber);
      
      // Step 1: Request authentication
      const authResult = await this.sendRequest('auth/request', {
        phoneNumber: phoneNumber
      });

      if (authResult.status === 'pending') {
        console.log('📱 Authentication pending. User needs to get passcode from Fi Money app');
        return {
          status: 'pending',
          loginUrl: authResult.loginUrl || `https://fi.money/auth?phone=${phoneNumber}`
        };
      }

      return authResult;
    } catch (error) {
      console.error('❌ Fi MCP Authentication Error:', error);
      return {
        status: 'failed'
      };
    }
  }

  /**
   * Complete authentication with passcode from Fi Money app
   */
  async verifyPasscode(phoneNumber: string, passcode: string): Promise<FiMcpAuthResponse> {
    try {
      console.log('🔑 Verifying passcode for:', phoneNumber);
      
      const result = await this.sendRequest('auth/verify', {
        phoneNumber,
        passcode
      });

      if (result.status === 'authenticated') {
        this.authToken = result.token;
        console.log('✅ Fi MCP Authentication successful');
      }

      return result;
    } catch (error) {
      console.error('❌ Passcode verification failed:', error);
      return {
        status: 'failed'
      };
    }
  }

  /**
   * Get complete financial data from Fi MCP
   */
  async getFinancialData(): Promise<FiMcpFinancialData> {
    if (!this.authToken) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    try {
      console.log('📊 Fetching financial data from Fi MCP...');
      
      const data = await this.sendRequest('data/financial', {
        token: this.authToken,
        includeAll: true
      });

      console.log('✅ Financial data received from Fi MCP');
      return data;
    } catch (error) {
      console.error('❌ Error fetching financial data:', error);
      throw error;
    }
  }

  /**
   * Get net worth history
   */
  async getNetWorthHistory(period: '1m' | '3m' | '6m' | '1y' = '6m'): Promise<Array<{
    date: string;
    netWorth: number;
    breakdown: {
      assets: number;
      liabilities: number;
    };
  }>> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await this.sendRequest('data/networth-history', {
        token: this.authToken,
        period
      });

      return result.history || [];
    } catch (error) {
      console.error('❌ Error fetching net worth history:', error);
      throw error;
    }
  }

  /**
   * Get portfolio performance metrics
   */
  async getPortfolioPerformance(): Promise<{
    cagr: number;
    xirr: number;
    ytd: number;
    assetWiseReturns: Array<{
      assetType: string;
      returns: number;
      performance: 'outperforming' | 'underperforming' | 'neutral';
    }>;
  }> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await this.sendRequest('data/portfolio-performance', {
        token: this.authToken
      });

      return result;
    } catch (error) {
      console.error('❌ Error fetching portfolio performance:', error);
      throw error;
    }
  }

  /**
   * Get underperforming investments
   */
  async getUnderperformingInvestments(): Promise<Array<{
    name: string;
    type: 'mutual_fund' | 'stock' | 'fd';
    currentValue: number;
    returns: number;
    benchmark: string;
    underperformance: number;
    recommendation: string;
  }>> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await this.sendRequest('analysis/underperforming', {
        token: this.authToken
      });

      return result.underperformingAssets || [];
    } catch (error) {
      console.error('❌ Error fetching underperforming investments:', error);
      return [];
    }
  }

  /**
   * Calculate loan affordability
   */
  async calculateAffordability(loanAmount: number, loanType: 'home' | 'personal' | 'car'): Promise<{
    affordable: boolean;
    maxAffordableLoan: number;
    estimatedEmi: number;
    debtToIncomeRatio: number;
    recommendation: string;
  }> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await this.sendRequest('analysis/affordability', {
        token: this.authToken,
        loanAmount,
        loanType
      });

      return result;
    } catch (error) {
      console.error('❌ Error calculating affordability:', error);
      throw error;
    }
  }

  /**
   * Project future net worth
   */
  async projectNetWorth(targetAge: number, currentAge: number, monthlyInvestment?: number): Promise<{
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
  }> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await this.sendRequest('analysis/projection', {
        token: this.authToken,
        targetAge,
        currentAge,
        monthlyInvestment
      });

      return result;
    } catch (error) {
      console.error('❌ Error projecting net worth:', error);
      throw error;
    }
  }

  /**
   * Detect financial anomalies
   */
  async detectAnomalies(): Promise<Array<{
    type: 'expense_spike' | 'idle_cash' | 'high_interest' | 'concentration_risk';
    severity: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
    recommendation: string;
    amount?: number;
  }>> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await this.sendRequest('analysis/anomalies', {
        token: this.authToken
      });

      return result.anomalies || [];
    } catch (error) {
      console.error('❌ Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    authenticated: boolean;
    lastUpdate?: Date;
  } {
    return {
      connected: this.isConnected,
      authenticated: !!this.authToken,
      lastUpdate: new Date()
    };
  }

  /**
   * Schedule reconnection if connection is lost
   */
  private scheduleReconnect(): void {
    setTimeout(() => {
      if (!this.isConnected) {
        console.log('🔄 Attempting to reconnect to Fi MCP...');
        this.initialize().catch(console.error);
      }
    }, 5000);
  }

  /**
   * Cleanup connections
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.authToken = null;
    this.pendingRequests.clear();
  }
}