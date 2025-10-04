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

/**
 * AI Service for Fi MCP Server Integration
 * Enables natural-language financial conversations using real Fi MCP data
 * Examples: "How much money will I have at 40?", "Can I afford a ₹50L home loan?"
 */
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
    const messageContext: StoredContext = {
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
      context: {
        net_worth: messageContext.netWorth,
        portfolio_snapshot: messageContext.portfolioSnapshot,
        market_conditions: messageContext.marketConditions
      }
    };
    
    await this.chatHistory.addMessage(userMessage);

    try {
      // Determine query type and handle accordingly
      const queryType = this.determineQueryType(query);
      let response: AIResponse;

      switch (queryType) {
        case 'projection':
          response = await this.handleProjectionQuery(query);
          break;
        case 'affordability':
          response = await this.handleAffordabilityQuery(query);
          break;
        case 'performance':
          response = await this.handlePerformanceQuery(query);
          break;
        case 'networth':
          response = await this.handleNetWorthQuery(query);
          break;
        case 'general':
        default:
          response = await this.handleGeneralFinancialQuery(query);
          break;
      }

      // Store AI's response
      const aiMessage = {
        user_id: this.context.userId,
        content: response.content,
        is_user: false,
        type: response.type,
        data: response.data,
        context: {
          net_worth: messageContext.netWorth,
          portfolio_snapshot: messageContext.portfolioSnapshot,
          market_conditions: messageContext.marketConditions
        }
      };
      
      await this.chatHistory.addMessage(aiMessage);

      return response;
    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorResponse: AIResponse = {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'text'
      };
      
      return errorResponse;
    }
  }

  /**
   * Determine the type of financial query
   */
  private determineQueryType(query: string): 'projection' | 'affordability' | 'performance' | 'networth' | 'general' {
    const lowerQuery = query.toLowerCase();
    
    // Projection queries: "How much money will I have at 40?"
    if (lowerQuery.includes('will i have') || lowerQuery.includes('at age') || 
        lowerQuery.includes('in years') || lowerQuery.includes('retirement') ||
        lowerQuery.includes('future') || lowerQuery.includes('projection')) {
      return 'projection';
    }
    
    // Affordability queries: "Can I afford a ₹50L home loan?"
    if (lowerQuery.includes('can i afford') || lowerQuery.includes('can i buy') ||
        lowerQuery.includes('should i buy') || lowerQuery.includes('loan eligibility')) {
      return 'affordability';
    }
    
    // Performance queries: "Which SIPs underperformed the market?"
    if (lowerQuery.includes('performance') || lowerQuery.includes('underperformed') ||
        lowerQuery.includes('sip') || lowerQuery.includes('return') ||
        lowerQuery.includes('gains') || lowerQuery.includes('losses')) {
      return 'performance';
    }
    
    // Net worth queries: "How's my net worth growing?"
    if (lowerQuery.includes('net worth') || lowerQuery.includes('wealth') ||
        lowerQuery.includes('total assets') || lowerQuery.includes('growing')) {
      return 'networth';
    }
    
    return 'general';
  }

  /**
   * Handle projection queries using Fi MCP data
   * Examples: "How much money will I have at 40?", "What will my net worth be in 10 years?"
   */
  private async handleProjectionQuery(query: string): Promise<AIResponse> {
    if (!this.context.financialData) {
      return {
        content: "I need access to your financial data to make projections. Please connect your accounts through Fi MCP first.",
        type: 'text'
      };
    }

    const currentAge = this.extractAge(query) || 30; // Default assumption
    const targetAge = this.extractTargetAge(query) || 60;
    const yearsToProject = Math.max(targetAge - currentAge, 1);
    
    const currentNetWorth = this.context.financialData.portfolio.netWorth.value;
    const monthlyInvestments = this.calculateMonthlyInvestments();
    
    // Simple projection with compound growth (8% annual return assumption)
    const annualReturn = 0.08;
    const futureValue = this.calculateFutureValue(currentNetWorth, monthlyInvestments, annualReturn, yearsToProject);
    
    const projectionData = this.generateProjectionChart(currentNetWorth, futureValue, yearsToProject);

    return {
      content: `Based on your current financial profile from Fi MCP data:\n\n` +
               `• Current Net Worth: ₹${this.formatCurrency(currentNetWorth)}\n` +
               `• Projected Net Worth at age ${targetAge}: ₹${this.formatCurrency(futureValue)}\n` +
               `• Growth over ${yearsToProject} years: ₹${this.formatCurrency(futureValue - currentNetWorth)}\n\n` +
               `This projection assumes an 8% annual return and includes your current investment patterns. ` +
               `Consider increasing your SIP contributions to reach your goals faster.`,
      type: 'chart',
      data: projectionData
    };
  }

  /**
   * Handle affordability queries using Fi MCP data
   * Examples: "Can I afford a ₹50L home loan?", "Should I buy a car worth ₹15L?"
   */
  private async handleAffordabilityQuery(query: string): Promise<AIResponse> {
    if (!this.context.financialData) {
      return {
        content: "I need access to your financial data to assess affordability. Please connect your accounts through Fi MCP first.",
        type: 'text'
      };
    }

    const amount = this.extractAmount(query);
    const currentEMIs = this.calculateCurrentEMIs();
    const monthlyIncome = this.estimateMonthlyIncome();
    const availableForEMI = monthlyIncome * 0.4 - currentEMIs; // 40% EMI rule
    
    let affordabilityAdvice = '';
    let isAffordable = false;

    if (query.toLowerCase().includes('loan')) {
      // Calculate EMI for the loan amount (assuming 20-year tenure, 8.5% interest)
      const emi = this.calculateEMI(amount, 0.085, 20);
      isAffordable = emi <= availableForEMI;
      
      affordabilityAdvice = `Based on your Fi MCP financial data:\n\n` +
                           `• Loan Amount: ₹${this.formatCurrency(amount)}\n` +
                           `• Estimated EMI: ₹${this.formatCurrency(emi)}\n` +
                           `• Available EMI Capacity: ₹${this.formatCurrency(availableForEMI)}\n` +
                           `• Current Net Worth: ₹${this.formatCurrency(this.context.financialData.portfolio.netWorth.value)}\n\n` +
                           `${isAffordable ? '✅ Yes, this loan appears affordable' : '❌ This loan may strain your finances'}\n\n` +
                           `Recommendation: ${isAffordable ? 
                             'Ensure you have 6 months of expenses as emergency fund before taking the loan.' :
                             'Consider a smaller loan amount or improve your income before applying.'}`;
    } else {
      // One-time purchase
      const availableLiquidity = this.context.financialData.portfolio.assets.breakdown.cash.value;
      isAffordable = amount <= availableLiquidity * 0.8; // Don't use all cash
      
      affordabilityAdvice = `Based on your Fi MCP financial data:\n\n` +
                           `• Purchase Amount: ₹${this.formatCurrency(amount)}\n` +
                           `• Available Cash: ₹${this.formatCurrency(availableLiquidity)}\n` +
                           `• Recommended Safe Spending: ₹${this.formatCurrency(availableLiquidity * 0.8)}\n\n` +
                           `${isAffordable ? '✅ Yes, this purchase is within your means' : '❌ This purchase would impact your liquidity'}\n\n` +
                           `Recommendation: ${isAffordable ? 
                             'You can afford this purchase without significantly impacting your financial stability.' :
                             'Consider saving more or finding a lower-cost alternative.'}`;
    }

    return {
      content: affordabilityAdvice,
      type: 'text'
    };
  }

  /**
   * Handle performance queries using Fi MCP data
   * Examples: "Which SIPs underperformed the market?", "How are my investments doing?"
   */
  private async handlePerformanceQuery(query: string): Promise<AIResponse> {
    if (!this.context.financialData) {
      return {
        content: "I need access to your investment data to analyze performance. Please connect your accounts through Fi MCP first.",
        type: 'text'
      };
    }

    try {
      const investmentPerformance = await mcpApi.getInvestmentPerformance('month');
      const marketInsights = await this.googleFinance.getPortfolioInsights(this.context.financialData.portfolio);
      
      let performanceAnalysis = "Based on your Fi MCP investment data:\n\n";
      
      // Overall portfolio performance
      performanceAnalysis += `📊 Overall Portfolio Performance:\n`;
      performanceAnalysis += `• Total Return: ${investmentPerformance.overall.return.toFixed(2)}%\n`;
      performanceAnalysis += `• Change: ₹${this.formatCurrency(investmentPerformance.overall.change.value)}\n\n`;
      
      // Asset-wise breakdown
      performanceAnalysis += `📈 Asset-wise Performance:\n`;
      investmentPerformance.breakdown.forEach(asset => {
        const status = asset.return >= 0 ? '📈' : '📉';
        performanceAnalysis += `${status} ${asset.type}: ${asset.return.toFixed(2)}% (₹${this.formatCurrency(asset.change.value)})\n`;
      });
      
      // Market insights
      if (marketInsights.length > 0) {
        performanceAnalysis += `\n💡 Key Insights:\n`;
        marketInsights.forEach(insight => {
          performanceAnalysis += `• ${insight.message}\n`;
        });
      }
      
      // Create performance chart
      const chartData = {
        type: 'pie' as const,
        data: investmentPerformance.breakdown.map(asset => ({
          name: asset.type,
          value: Math.abs(asset.change.value)
        }))
      };

      return {
        content: performanceAnalysis,
        type: 'chart',
        data: chartData
      };
    } catch (error) {
      return {
        content: "Unable to fetch detailed performance data at the moment. Your overall portfolio is connected through Fi MCP and tracking well.",
        type: 'text'
      };
    }
  }

  /**
   * Handle net worth queries using Fi MCP data
   * Examples: "How's my net worth growing?", "Show me my wealth trend"
   */
  private async handleNetWorthQuery(query: string): Promise<AIResponse> {
    if (!this.context.financialData) {
      return {
        content: "I need access to your financial data to analyze net worth trends. Please connect your accounts through Fi MCP first.",
        type: 'text'
      };
    }

    const netWorthHistory = this.context.financialData.netWorthTrend;
    const currentNetWorth = this.context.financialData.portfolio.netWorth.value;
    const previousNetWorth = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 2].netWorth.value : currentNetWorth;
    const growth = currentNetWorth - previousNetWorth;
    const growthPercent = previousNetWorth > 0 ? (growth / previousNetWorth) * 100 : 0;

    const chartData = {
      type: 'line' as const,
      data: netWorthHistory.map(item => ({
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
        value: item.netWorth.value
      }))
    };

    const trendAnalysis = `📈 Net Worth Analysis (Fi MCP Data):\n\n` +
                         `• Current Net Worth: ₹${this.formatCurrency(currentNetWorth)}\n` +
                         `• Monthly Growth: ₹${this.formatCurrency(growth)} (${growthPercent.toFixed(1)}%)\n` +
                         `• Assets: ₹${this.formatCurrency(this.context.financialData.portfolio.assets.total.value)}\n` +
                         `• Liabilities: ₹${this.formatCurrency(this.context.financialData.portfolio.liabilities.total.value)}\n\n` +
                         `${growth >= 0 ? '🎯 Great job! Your wealth is growing steadily.' : '⚠️ Your net worth declined this month. Let\'s identify areas for improvement.'}\n\n` +
                         `Key Insight: ${this.getNetWorthInsight(growthPercent)}`;

    return {
      content: trendAnalysis,
      type: 'chart',
      data: chartData
    };
  }

  /**
   * Handle general financial queries using Fi MCP data and Gemini
   */
  private async handleGeneralFinancialQuery(query: string): Promise<AIResponse> {
    if (!this.context.connectionStatus?.isConnected) {
      return {
        content: "To provide personalized financial insights, please connect your accounts through Fi MCP first. This will give me access to your real financial data across 18+ sources including banks, investments, EPF, and more.",
        type: 'suggestion'
      };
    }

    // Use Google Gemini for general financial advice with Fi MCP context
    const context = this.buildFinancialContext();
    const geminiResponse = await this.callGeminiAPI(query, context);
    
    return {
      content: geminiResponse,
      type: 'text'
    };
  }

  // Helper methods
  private extractAge(query: string): number | null {
    const ageMatch = query.match(/(?:age|am)\s+(\d+)/i);
    return ageMatch ? parseInt(ageMatch[1]) : null;
  }

  private extractTargetAge(query: string): number | null {
    const targetMatch = query.match(/(?:at|by)\s+(\d+)/i);
    return targetMatch ? parseInt(targetMatch[1]) : null;
  }

  private extractAmount(query: string): number {
    const amountMatch = query.match(/₹(\d+(?:\.\d+)?)\s*([LlCc]?)/i);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      const unit = amountMatch[2]?.toLowerCase();
      if (unit === 'l') return amount * 100000; // Lakh
      if (unit === 'c') return amount * 10000000; // Crore
      return amount;
    }
    return 0;
  }

  private calculateMonthlyInvestments(): number {
    if (!this.context.financialData) return 0;
    // Estimate from recent transactions or portfolio breakdown
    return 25000; // Default estimate
  }

  private calculateFutureValue(principal: number, monthlyInvestment: number, annualReturn: number, years: number): number {
    const monthlyReturn = annualReturn / 12;
    const months = years * 12;
    
    // Future value of existing principal
    const futureValuePrincipal = principal * Math.pow(1 + annualReturn, years);
    
    // Future value of monthly investments (annuity)
    const futureValueAnnuity = monthlyInvestment * (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;
    
    return futureValuePrincipal + futureValueAnnuity;
  }

  private generateProjectionChart(current: number, future: number, years: number) {
    const data = [];
    for (let year = 0; year <= years; year++) {
      const value = current + ((future - current) * year / years);
      data.push({
        name: `Year ${year}`,
        value: Math.round(value)
      });
    }
    
    return {
      type: 'line' as const,
      data
    };
  }

  private calculateCurrentEMIs(): number {
    if (!this.context.financialData) return 0;
    // Calculate from liabilities
    const loans = this.context.financialData.portfolio.liabilities.breakdown.loans.value;
    return loans * 0.01; // Rough estimate: 1% of loan amount as monthly EMI
  }

  private estimateMonthlyIncome(): number {
    if (!this.context.financialData) return 100000; // Default
    // Estimate from transaction patterns
    const recentCredits = this.context.financialData.recentTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount.value, 0);
    return Math.max(recentCredits, 100000);
  }

  private calculateEMI(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  }

  private getNetWorthInsight(growthPercent: number): string {
    if (growthPercent > 5) return "Excellent growth! You're on track for strong wealth building.";
    if (growthPercent > 0) return "Steady progress. Consider increasing investments to accelerate growth.";
    return "Focus on reducing expenses and increasing investments to get back on track.";
  }

  private buildFinancialContext(): string {
    if (!this.context.financialData) return "User has not connected Fi MCP data yet.";
    
    return `Financial Profile (Fi MCP Data):
    - Net Worth: ₹${this.formatCurrency(this.context.financialData.portfolio.netWorth.value)}
    - Assets: ₹${this.formatCurrency(this.context.financialData.portfolio.assets.total.value)}
    - Liabilities: ₹${this.formatCurrency(this.context.financialData.portfolio.liabilities.total.value)}
    - Recent transactions: ${this.context.financialData.recentTransactions.length} transactions
    - Investment breakdown: Stocks ₹${this.formatCurrency(this.context.financialData.portfolio.assets.breakdown.stocks.value)}, 
      Mutual Funds ₹${this.formatCurrency(this.context.financialData.portfolio.assets.breakdown.mutualFunds.value)}`;
  }

  private async callGeminiAPI(query: string, context: string): Promise<string> {
    try {
      // This would integrate with Google Gemini API
      // For now, provide a structured response based on Fi MCP data
      return `Based on your Fi MCP financial data: ${context}\n\nRegarding "${query}": I can provide personalized advice using your real financial profile. Your current financial health looks ${this.context.financialData ? 'stable' : 'unknown'} with diversified investments across multiple asset classes.`;
    } catch (error) {
      return "I'm processing your request using your Fi MCP data. Please ensure your accounts are connected for the most accurate advice.";
    }
  }

  private formatCurrency(amount: number): string {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  }

  async getSuggestions(): Promise<string[]> {
    if (!this.context.connectionStatus?.isConnected) {
      return [
        "Connect your accounts through Fi MCP",
        "How does Fi MCP work?",
        "What financial data can you access?",
        "Show me sample financial insights"
      ];
    }

    return [
      "How much money will I have at 40?",
      "Can I afford a ₹50L home loan?",
      "Which SIPs underperformed the market?",
      "How's my net worth growing?",
      "What are my biggest expenses?",
      "Should I invest more in equities?",
      "When can I retire comfortably?",
      "Analyze my investment portfolio"
    ];
  }
}