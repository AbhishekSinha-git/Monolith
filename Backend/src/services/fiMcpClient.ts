import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

/**
 * Fi MCP Client - Proper MCP Protocol Implementation
 * Uses the Model Context Protocol SDK to connect to Fi Money's MCP Server
 * Following the exact specifications from Fi Money documentation
 */

/**
 * Get the correct npx command for the current platform
 * On Windows, we need to use 'npx.cmd' instead of 'npx'
 */
function getNpxCommand(): string {
  const isWindows = os.platform() === 'win32';
  return isWindows ? 'npx.cmd' : 'npx';
}

interface FiMcpToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

interface FiMcpResourceResponse {
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}

export class FiMcpClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected = false;
  private authenticatedPhoneNumber: string | null = null;
  private authenticatedPasscode: string | null = null;

  constructor() {
    console.log('🚀 Initializing Fi MCP Client');
  }

  /**
   * Initialize connection to Fi MCP using mcp-remote
   * This follows the exact pattern from Fi Money documentation
   */
  async initialize(): Promise<void> {
    try {
      console.log('📡 Connecting to Fi MCP Server via mcp-remote...');
      
      const npxCommand = getNpxCommand();
      console.log(`🔧 Using npx command: ${npxCommand}`);
      
      // Create MCP transport using stdio with correct Windows command
      this.transport = new StdioClientTransport({
        command: npxCommand,
        args: ['-y', 'mcp-remote', 'https://mcp.fi.money:8080/mcp/stream']
      });

      // Initialize MCP client
      this.client = new Client({
        name: 'future-finance-ai',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {},
          resources: {}
        }
      });

      // Connect to the MCP server
      await this.client.connect(this.transport);
      
      this.isConnected = true;
      console.log('✅ Connected to Fi MCP Server successfully');
      
      // List available tools and resources
      await this.discoverCapabilities();
      
    } catch (error) {
      console.error('❌ Failed to initialize Fi MCP Client:', error);
      throw error;
    }
  }

  /**
   * Discover available MCP tools and resources
   */
  private async discoverCapabilities(): Promise<void> {
    if (!this.client) return;

    try {
      // List available tools
      const toolsResponse = await this.client.listTools();
      console.log('🔧 Available Fi MCP Tools:', toolsResponse.tools.map(t => t.name));

      // List available resources
      const resourcesResponse = await this.client.listResources();
      console.log('📊 Available Fi MCP Resources:', resourcesResponse.resources.map(r => r.uri));
    } catch (error) {
      console.error('❌ Error discovering capabilities:', error);
    }
  }

  /**
   * Authenticate user with phone number
   * Fi MCP doesn't have separate auth - passcode is verified through data requests
   */
  async authenticateWithPhone(phoneNumber: string): Promise<{
    status: 'pending' | 'authenticated';
    loginUrl?: string;
    message: string;
  }> {
    console.log('🔐 Initiating authentication for:', phoneNumber);
    
    this.authenticatedPhoneNumber = phoneNumber;

    return {
      status: 'pending',
      message: 'Please get your passcode from the Fi Money app: Net Worth Dashboard > Talk to AI > Get Passcode'
    };
  }

  /**
   * Verify passcode from Fi Money app
   * Fi MCP handles authentication through tool arguments, not connection URL
   */
  async verifyPasscode(phoneNumber: string, passcode: string): Promise<{
    status: 'authenticated' | 'failed';
    message: string;
    token?: string;
    data?: any;
    loginUrl?: string;
  }> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Fi MCP Client not connected');
      }

      console.log('🔑 Verifying passcode for:', phoneNumber);
      console.log('� Testing authentication with fetch_net_worth tool...');

      // Store credentials for future requests
      this.authenticatedPhoneNumber = phoneNumber;
      this.authenticatedPasscode = passcode;

      // Test authentication by calling fetch_net_worth with phone and passcode
      const response = await this.client.callTool({
        name: 'fetch_net_worth',
        arguments: {
          phone: phoneNumber,
          passcode: passcode
        }
      }) as FiMcpToolResponse;

      const resultText = response.content[0]?.text || '';
      console.log('📄 Received response from Fi MCP');
      console.log('🔍 Raw response text:', resultText);
      
      // Try to parse as JSON to see if we got actual data
      try {
        const data = JSON.parse(resultText);
        console.log('✅ Successfully parsed JSON data:', JSON.stringify(data, null, 2));
        
        // Check if we need to login first
        if (data && data.status === 'login_required' && data.login_url) {
          console.log('🔗 Login required - returning login URL');
          return {
            status: 'failed',
            message: 'Login required. Please visit the login URL first.',
            loginUrl: data.login_url
          };
        }
        
        // Check if we got valid financial data (not login_required)
        if (data && typeof data === 'object' && !data.error && data.status !== 'login_required') {
          console.log('✅ Authentication successful - received net worth data');
          
          return {
            status: 'authenticated',
            message: 'Successfully authenticated with Fi MCP!',
            token: passcode,
            data: data
          };
        } else if (data && data.error) {
          console.error('❌ Fi MCP returned error:', data.error);
          return {
            status: 'failed',
            message: data.error || 'Authentication failed'
          };
        }
      } catch (parseError) {
        console.error('❌ Failed to parse response:', resultText);
        // If it's not JSON, check if it's an error message
        if (resultText.toLowerCase().includes('invalid') || 
            resultText.toLowerCase().includes('error') || 
            resultText.toLowerCase().includes('unauthorized') ||
            resultText.toLowerCase().includes('authentication')) {
          return {
            status: 'failed',
            message: resultText || 'Invalid passcode. Please check and try again.'
          };
        }
      }

      return {
        status: 'failed',
        message: 'Unable to verify passcode. Please try again.'
      };
    } catch (error: any) {
      console.error('❌ Passcode verification error:', error);
      return {
        status: 'failed',
        message: error.message || 'Passcode verification failed. Please check your passcode and try again.'
      };
    }
  }

  /**
   * Query Fi MCP with natural language
   * This is the main method for asking questions about financial data
   */
  async query(question: string): Promise<string> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Fi MCP Client not connected');
      }

      if (!this.authenticatedPhoneNumber) {
        throw new Error('Not authenticated. Please authenticate first.');
      }

      console.log('💬 Querying Fi MCP:', question);

      // Call the Fi MCP query tool
      const response = await this.client.callTool({
        name: 'fi_query',
        arguments: {
          query: question
        }
      }) as FiMcpToolResponse;

      const answer = response.content[0]?.text || 'No response from Fi MCP';
      console.log('✅ Fi MCP Response received');

      return answer;
    } catch (error) {
      console.error('❌ Query error:', error);
      throw error;
    }
  }

  /**
   * Get net worth data using Fi MCP tool
   */
  async getNetWorth(): Promise<any> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Client not initialized');
      }

      if (!this.authenticatedPhoneNumber || !this.authenticatedPasscode) {
        throw new Error('Not authenticated. Please authenticate first.');
      }

      console.log('💰 Fetching net worth data from Fi MCP...');

      const response = await this.client.callTool({
        name: 'fetch_net_worth',
        arguments: {
          phone: this.authenticatedPhoneNumber,
          passcode: this.authenticatedPasscode
        }
      }) as FiMcpToolResponse;

      const resultText = response.content[0]?.text || '{}';
      return JSON.parse(resultText);
    } catch (error) {
      console.error('❌ Error getting net worth:', error);
      throw error;
    }
  }

  /**
   * Get portfolio performance
   */
  async getPortfolioPerformance(): Promise<any> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Client not initialized');
      }

      if (!this.authenticatedPhoneNumber || !this.authenticatedPasscode) {
        throw new Error('Not authenticated. Please authenticate first.');
      }

      console.log('📊 Fetching portfolio performance (mutual funds + stocks)...');

      // Fetch mutual fund transactions
      const mfResponse = await this.client.callTool({
        name: 'fetch_mf_transactions',
        arguments: {
          phone: this.authenticatedPhoneNumber,
          passcode: this.authenticatedPasscode
        }
      }) as FiMcpToolResponse;

      // Fetch stock transactions
      const stockResponse = await this.client.callTool({
        name: 'fetch_stock_transactions',
        arguments: {
          phone: this.authenticatedPhoneNumber,
          passcode: this.authenticatedPasscode
        }
      }) as FiMcpToolResponse;

      return {
        mutualFunds: JSON.parse(mfResponse.content[0]?.text || '{}'),
        stocks: JSON.parse(stockResponse.content[0]?.text || '{}')
      };
    } catch (error) {
      console.error('❌ Error getting portfolio performance:', error);
      throw error;
    }
  }

  /**
   * Get bank transactions
   */
  async getBankTransactions(): Promise<any> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Client not initialized');
      }

      if (!this.authenticatedPhoneNumber || !this.authenticatedPasscode) {
        throw new Error('Not authenticated. Please authenticate first.');
      }

      console.log('🏦 Fetching bank transactions...');

      const response = await this.client.callTool({
        name: 'fetch_bank_transactions',
        arguments: {
          phone: this.authenticatedPhoneNumber,
          passcode: this.authenticatedPasscode
        }
      }) as FiMcpToolResponse;

      return JSON.parse(response.content[0]?.text || '{}');
    } catch (error) {
      console.error('❌ Error getting bank transactions:', error);
      throw error;
    }
  }

  /**
   * Get credit report
   */
  async getCreditReport(): Promise<any> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Client not initialized');
      }

      if (!this.authenticatedPhoneNumber || !this.authenticatedPasscode) {
        throw new Error('Not authenticated. Please authenticate first.');
      }

      console.log('💳 Fetching credit report...');

      const response = await this.client.callTool({
        name: 'fetch_credit_report',
        arguments: {
          phone: this.authenticatedPhoneNumber,
          passcode: this.authenticatedPasscode
        }
      }) as FiMcpToolResponse;

      return JSON.parse(response.content[0]?.text || '{}');
    } catch (error) {
      console.error('❌ Error getting credit report:', error);
      throw error;
    }
  }

  /**
   * Get EPF details
   */
  async getEPFDetails(): Promise<any> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Client not initialized');
      }

      if (!this.authenticatedPhoneNumber || !this.authenticatedPasscode) {
        throw new Error('Not authenticated. Please authenticate first.');
      }

      console.log('🏢 Fetching EPF details...');

      const response = await this.client.callTool({
        name: 'fetch_epf_details',
        arguments: {
          phone: this.authenticatedPhoneNumber,
          passcode: this.authenticatedPasscode
        }
      }) as FiMcpToolResponse;

      return JSON.parse(response.content[0]?.text || '{}');
    } catch (error) {
      console.error('❌ Error getting EPF details:', error);
      throw error;
    }
  }

  /**
   * Fetch all financial data at once
   */
  async fetchAllFinancialData(): Promise<any> {
    try {
      console.log('📦 Fetching all financial data from Fi MCP...');
      
      const [netWorth, bankTransactions, creditReport, portfolio, epf] = await Promise.allSettled([
        this.getNetWorth(),
        this.getBankTransactions(),
        this.getCreditReport(),
        this.getPortfolioPerformance(),
        this.getEPFDetails()
      ]);

      console.log('🔍 Raw Fi MCP Data Results:');
      console.log('📊 Net Worth Status:', netWorth.status);
      if (netWorth.status === 'fulfilled') {
        console.log('💰 Net Worth Data:', JSON.stringify(netWorth.value, null, 2));
      } else {
        console.log('❌ Net Worth Error:', netWorth.reason);
      }

      console.log('🏦 Bank Transactions Status:', bankTransactions.status);
      if (bankTransactions.status === 'fulfilled') {
        console.log('💳 Bank Transactions Data:', JSON.stringify(bankTransactions.value, null, 2));
      } else {
        console.log('❌ Bank Transactions Error:', bankTransactions.reason);
      }

      console.log('📈 Credit Report Status:', creditReport.status);
      if (creditReport.status === 'fulfilled') {
        console.log('📊 Credit Report Data:', JSON.stringify(creditReport.value, null, 2));
      } else {
        console.log('❌ Credit Report Error:', creditReport.reason);
      }

      console.log('💼 Portfolio Status:', portfolio.status);
      if (portfolio.status === 'fulfilled') {
        console.log('📈 Portfolio Data:', JSON.stringify(portfolio.value, null, 2));
      } else {
        console.log('❌ Portfolio Error:', portfolio.reason);
      }

      console.log('🏛️ EPF Status:', epf.status);
      if (epf.status === 'fulfilled') {
        console.log('💼 EPF Data:', JSON.stringify(epf.value, null, 2));
      } else {
        console.log('❌ EPF Error:', epf.reason);
      }

      const result = {
        netWorth: netWorth.status === 'fulfilled' ? netWorth.value : null,
        bankTransactions: bankTransactions.status === 'fulfilled' ? bankTransactions.value : null,
        creditReport: creditReport.status === 'fulfilled' ? creditReport.value : null,
        portfolio: portfolio.status === 'fulfilled' ? portfolio.value : null,
        epf: epf.status === 'fulfilled' ? epf.value : null
      };

      console.log('📋 Final Financial Data Summary:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ Error fetching all financial data:', error);
      throw error;
    }
  }

  /**
   * Get underperforming investments
   */
  async getUnderperformingInvestments(): Promise<any> {
    try {
      const answer = await this.query("Which of my investments are underperforming the market? List mutual funds and stocks that are below their benchmarks.");
      return { underperforming: answer };
    } catch (error) {
      console.error('❌ Error getting underperforming investments:', error);
      throw error;
    }
  }

  /**
   * Calculate affordability
   */
  async calculateAffordability(loanAmount: number, loanType: string): Promise<any> {
    try {
      const answer = await this.query(`Can I afford a ₹${loanAmount / 100000}L ${loanType} loan? Consider my current EMIs, income, and debt-to-income ratio.`);
      return { affordability: answer };
    } catch (error) {
      console.error('❌ Error calculating affordability:', error);
      throw error;
    }
  }

  /**
   * Project future net worth
   */
  async projectNetWorth(targetAge: number, currentAge: number): Promise<any> {
    try {
      const answer = await this.query(`How much money will I have at age ${targetAge}? I am currently ${currentAge} years old. Project my net worth based on my current investment patterns.`);
      return { projection: answer };
    } catch (error) {
      console.error('❌ Error projecting net worth:', error);
      throw error;
    }
  }

  /**
   * Detect financial anomalies
   */
  async detectAnomalies(): Promise<any> {
    try {
      const answer = await this.query("Analyze my finances and identify any anomalies, inefficiencies, or areas where I'm losing money unnecessarily. Check for idle cash, high-interest debt, and expense spikes.");
      return { anomalies: answer };
    } catch (error) {
      console.error('❌ Error detecting anomalies:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    authenticated: boolean;
    phoneNumber?: string;
  } {
    return {
      connected: this.isConnected,
      authenticated: !!this.authenticatedPhoneNumber,
      phoneNumber: this.authenticatedPhoneNumber || undefined
    };
  }

  /**
   * Disconnect from Fi MCP
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
      }
      if (this.transport) {
        await this.transport.close();
      }
      this.isConnected = false;
      this.authenticatedPhoneNumber = null;
      console.log('🔌 Disconnected from Fi MCP');
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }
}