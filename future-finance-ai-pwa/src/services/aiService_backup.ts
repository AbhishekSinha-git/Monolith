import { mcpApi } from '@/api/mcp';
import type { Portfolio, Transaction, MoneyValue, FiMcpConnectionStatus } from '@/api/mcp';
import { GoogleFinanceService } from '@/services/googleFinance';
import { ChatHistoryService, type StoredContext } from '@/services/chatHistory';

interface FinancialData {
  portfolio: Portfolio;
  recentTransactions: Transaction[];
  netWorthTrend: Array<{ date: string; netWorth: MoneyValue }>;
  spendingBreakdown: Array<{ category: string; total: MoneyValue }>;
  lastUpdated: Date;
}

interface AIResponse {
  content: string;
  type: 'text' | 'chart' | 'suggestion';
  data?: {
    type: 'pie' | 'line';
    data: Array<{
      name: string;
      value: number;
    }>;
  };
}

interface AIContext {
  userId: string;
  financialData: FinancialData | null;
  connectionStatus: FiMcpConnectionStatus | null;
  lastQuery?: string;
}

export class AIService {
  private context: AIContext;
  private googleFinance: GoogleFinanceService;
  public chatHistory: ChatHistoryService;

  constructor(userId: string) {
    this.context = {
      userId,
      financialData: null,
      connectionStatus: null
    };
    this.googleFinance = new GoogleFinanceService();
    this.chatHistory = new ChatHistoryService(userId);
  }

  async initialize() {
    try {
      await Promise.all([
        this.chatHistory.initialize(),
        this.refreshContext()
      ]);
    } catch (error) {
      console.error('Error initializing AI service:', error);
      throw error;
    }
  }

  private async refreshContext(): Promise<void> {
    try {
      const connectionStatus = await mcpApi.getConnectionStatus();
      this.context.connectionStatus = connectionStatus;

      if (connectionStatus.isConnected) {
        const [portfolio, transactions, netWorthHistory, spendingAnalysis] = await Promise.all([
          mcpApi.getPortfolio(),
          mcpApi.getTransactions({ limit: 10 }),
          mcpApi.getNetWorthHistory('month'),
          mcpApi.getSpendingAnalysis('month')
        ]);

        this.context.financialData = {
          portfolio,
          recentTransactions: transactions,
          netWorthTrend: netWorthHistory,
          spendingBreakdown: spendingAnalysis,
          lastUpdated: new Date()
        };
      }
    } catch (error) {
      console.error('Error refreshing context:', error);
      throw error;
    }
  }

  async processQuery(query: string): Promise<AIResponse> {
    this.context.lastQuery = query;

    // Store context with the message
    const messageContext = {
      connectionStatus: this.context.connectionStatus!,
      netWorth: this.context.financialData?.portfolio.netWorth.value,
      portfolioSnapshot: this.context.financialData?.portfolio.assets.breakdown,
      marketConditions: await this.googleFinance.getMarketSummary()
    };

    // Store user's message first
    const userMessage = {
      user_id: this.context.userId,
      content: query,
      is_user: true,
      type: 'text' as const,
      context: messageContext
    };
    
    await this.chatHistory.addMessage(userMessage);

    try {
      // Determine if this is a financial planning question that requires projections
      const isProjectionQuery = this.isProjectionQuery(query);
      const isAffordabilityQuery = this.isAffordabilityQuery(query);
      const isPerformanceQuery = this.isPerformanceQuery(query);
      const isNetWorthQuery = this.isNetWorthQuery(query);

      let response: AIResponse;

      if (isProjectionQuery) {
        response = await this.handleProjectionQuery(query);
      } else if (isAffordabilityQuery) {
        response = await this.handleAffordabilityQuery(query);
      } else if (isPerformanceQuery) {
        response = await this.handlePerformanceQuery(query);
      } else if (isNetWorthQuery) {
        response = await this.handleNetWorthQuery(query);
      } else {
        // General financial query
        response = await this.handleGeneralFinancialQuery(query);
      }

      // Store AI's response
      const aiMessage = {
        user_id: this.context.userId,
        content: response.content,
        is_user: false,
        type: response.type,
        data: response.data,
        context: messageContext
      };
      
      await this.chatHistory.addMessage(aiMessage);

      return response;
    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorResponse: AIResponse = {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'text'
      };
      
      const errorMessage = {
        user_id: this.context.userId,
        content: errorResponse.content,
        is_user: false,
        type: 'text' as const,
        context: messageContext
      };
      
      await this.chatHistory.addMessage(errorMessage);
      
      return errorResponse;
    }
  }

  /**
   * Check if query is asking about future projections
   * Examples: "How much money will I have at 40?", "What will my net worth be in 10 years?"
   */
  private isProjectionQuery(query: string): boolean {
    const projectionKeywords = [
      'will i have', 'will my', 'at age', 'in years', 'in year',
      'future', 'projection', 'forecast', 'predict', 'estimate',
      'when i retire', 'by retirement', 'at retirement'
    ];
    return projectionKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if query is about affordability
   * Examples: "Can I afford a ₹50L home loan?", "Can I buy a car worth ₹15L?"
   */
  private isAffordabilityQuery(query: string): boolean {
    const affordabilityKeywords = [
      'can i afford', 'can i buy', 'can i get loan', 
      'should i buy', 'is it safe to', 'loan eligibility'
    ];
    return affordabilityKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if query is about investment performance
   * Examples: "Which SIPs underperformed the market?", "How are my investments doing?"
   */
  private isPerformanceQuery(query: string): boolean {
    const performanceKeywords = [
      'performance', 'underperformed', 'outperformed', 'return',
      'growth', 'gains', 'losses', 'sip', 'mutual fund',
      'stock performance', 'investment returns'
    ];
    return performanceKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if query is about net worth trends
   * Examples: "How's my net worth growing?", "Net worth trend analysis"
   */
  private isNetWorthQuery(query: string): boolean {
    const netWorthKeywords = [
      'net worth', 'wealth', 'total assets', 'financial health',
      'net worth growing', 'net worth trend', 'wealth growth'
    ];
    return netWorthKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }
      content: query,
      is_user: true,
      type: 'text' as const,
      context: messageContext
    };

    await this.chatHistory.addMessage(userMessage);

    // If not connected, return connection request
    if (!this.context.connectionStatus?.isConnected) {
      const response: AIResponse = {
        type: 'text',
        content: "I'd love to help you with your financial questions! However, I need access to your financial data to provide personalized insights. Please connect your accounts first by going to the Dashboard."
      };

      await this.chatHistory.addMessage({
        user_id: this.context.userId,
        content: response.content,
        is_user: false,
        type: 'text',
        context: messageContext
      });

      return response;
    }

    // Process query based on context
    let response: AIResponse;
    
    if (query.toLowerCase().includes('net worth')) {
      const netWorth = this.context.financialData?.portfolio.netWorth.value || 0;
      const assets = this.context.financialData?.portfolio.assets.total.value || 0;
      const liabilities = this.context.financialData?.portfolio.liabilities.total.value || 0;
      
      response = {
        type: 'text',
        content: `Your current net worth is ₹${netWorth.toLocaleString()}. This consists of ₹${assets.toLocaleString()} in assets and ₹${liabilities.toLocaleString()} in liabilities.`
      };
    } else if (query.toLowerCase().includes('investment') || query.toLowerCase().includes('portfolio')) {
      const breakdown = this.context.financialData?.portfolio.assets.breakdown;
      if (breakdown) {
        response = {
          type: 'chart',
          content: 'Here\'s your current investment portfolio breakdown:',
          data: {
            type: 'pie',
            data: Object.entries(breakdown).map(([key, value]) => ({
              name: key,
              value: value.value
            }))
          }
        };
      } else {
        response = {
          type: 'text',
          content: 'I couldn\'t retrieve your portfolio information. Please try again later.'
        };
      }
    } else {
      response = {
        type: 'text',
        content: 'I can help you analyze your finances, track your investments, and provide personalized financial advice. Try asking about your net worth, investment portfolio, or recent spending patterns.'
      };
    }

    // Store AI's response
    await this.chatHistory.addMessage({
      user_id: this.context.userId,
      content: response.content,
      is_user: false,
      type: response.type,
      data: response.data,
      context: messageContext
    });

    return response;
  }

  async getSuggestions(): Promise<string[]> {
    if (!this.context.connectionStatus?.isConnected) {
      return [
        "How do I connect my accounts?",
        "What data do you need?",
        "How secure is my data?",
        "What can you help me with?",
      ];
    }

    return [
      "How has my net worth changed?",
      "Show my investment portfolio",
      "Analyze my spending patterns",
      "What are my top expenses?",
      "How can I improve my finances?",
    ];
  }
}