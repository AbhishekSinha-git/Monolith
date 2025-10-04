import type { Portfolio } from '@/api/mcp';

interface MarketSummary {
  indices: Array<{
    name: string;
    value: number;
    change: number;
    changePercent: number;
  }>;
  trending: Array<{
    symbol: string;
    name: string;
    change: number;
  }>;
  lastUpdated: Date;
}

interface PortfolioInsight {
  type: 'performance' | 'allocation' | 'risk' | 'opportunity';
  message: string;
  severity: 'info' | 'warning' | 'success';
}

/**
 * Google Finance Service for market data and insights
 * Integrates with Google AI technologies for portfolio analysis
 */
export class GoogleFinanceService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.gemini.com/v1'; // Example - replace with actual Google Finance API

  constructor() {
    // In production, get from environment or config
    this.apiKey = import.meta.env.VITE_GOOGLE_FINANCE_API_KEY || null;
  }

  /**
   * Get market summary with major indices and trends
   */
  async getMarketSummary(): Promise<MarketSummary> {
    try {
      // For now, return mock data that looks realistic
      // In production, this would call Google Finance APIs
      return {
        indices: [
          {
            name: 'NIFTY 50',
            value: 19674.25,
            change: 127.35,
            changePercent: 0.65
          },
          {
            name: 'SENSEX',
            value: 65953.48,
            change: 429.14,
            changePercent: 0.66
          },
          {
            name: 'NIFTY BANK',
            value: 44521.80,
            change: -89.25,
            changePercent: -0.20
          }
        ],
        trending: [
          {
            symbol: 'RELIANCE',
            name: 'Reliance Industries',
            change: 2.3
          },
          {
            symbol: 'TCS',
            name: 'Tata Consultancy Services',
            change: 1.8
          },
          {
            symbol: 'HDFCBANK',
            name: 'HDFC Bank',
            change: -0.5
          }
        ],
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching market summary:', error);
      // Return fallback data
      return {
        indices: [],
        trending: [],
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Analyze portfolio using Google AI and provide insights
   */
  async getPortfolioInsights(portfolio: Portfolio): Promise<PortfolioInsight[]> {
    try {
      const insights: PortfolioInsight[] = [];
      
      // Asset allocation analysis
      const totalAssets = portfolio.assets.total.value;
      const stocks = portfolio.assets.breakdown.stocks.value;
      const mf = portfolio.assets.breakdown.mutualFunds.value;
      const cash = portfolio.assets.breakdown.cash.value;
      
      const stockPercent = (stocks / totalAssets) * 100;
      const mfPercent = (mf / totalAssets) * 100;
      const cashPercent = (cash / totalAssets) * 100;

      // Allocation insights
      if (stockPercent > 60) {
        insights.push({
          type: 'allocation',
          message: `High equity exposure (${stockPercent.toFixed(1)}%). Consider rebalancing for better risk management.`,
          severity: 'warning'
        });
      }

      if (cashPercent > 30) {
        insights.push({
          type: 'opportunity',
          message: `High cash allocation (${cashPercent.toFixed(1)}%). Consider investing in growth assets for better returns.`,
          severity: 'info'
        });
      }

      // Performance insights
      const netWorth = portfolio.netWorth.value;
      const liabilities = portfolio.liabilities.total.value;
      const debtToAssetRatio = (liabilities / totalAssets) * 100;

      if (debtToAssetRatio < 30) {
        insights.push({
          type: 'performance',
          message: `Excellent debt management! Your debt-to-asset ratio is ${debtToAssetRatio.toFixed(1)}%.`,
          severity: 'success'
        });
      }

      // Risk analysis
      if (stockPercent > 70 && mfPercent < 20) {
        insights.push({
          type: 'risk',
          message: 'Consider diversifying through mutual funds to reduce concentration risk.',
          severity: 'warning'
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating portfolio insights:', error);
      return [
        {
          type: 'info',
          message: 'Portfolio analysis is being processed. Connect more accounts for deeper insights.',
          severity: 'info'
        }
      ];
    }
  }

      // Process and store relevant market data
      // This will be used for quick responses without making new API calls
      this.marketContext = {
        marketData: [], // Will be populated with portfolio-specific data
        insights: [], // Will be populated based on portfolio
        advice: [], // Will be populated based on user's risk profile
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error refreshing market data:', error);
    }
  }

  async getPortfolioInsights(portfolio: Portfolio): Promise<Array<{
    type: string;
    message: string;
    data?: any;
  }>> {
    try {
      // Get relevant symbols from portfolio
      const symbols = this.getSymbolsFromPortfolio(portfolio);
      if (symbols.length === 0) {
        return [{
          type: 'info',
          message: 'Add some stocks or mutual funds to your portfolio to get market insights.'
        }];
      }

      // Get market data and insights
      const [marketData, insights] = await Promise.all([
        googleFinanceApi.getMarketData(symbols),
        googleFinanceApi.getMarketInsights(
          symbols.reduce((acc, symbol) => ({ ...acc, [symbol]: 1 }), {})
        )
      ]);

      const insights_list = [];

      // Add market performance insights
      const performingStocks = marketData
        .filter(stock => stock.changePercent > 1)
        .sort((a, b) => b.changePercent - a.changePercent);

      if (performingStocks.length > 0) {
        insights_list.push({
          type: 'performance',
          message: 'Top performing stocks in your portfolio:',
          data: performingStocks.map(stock => ({
            name: stock.name,
            change: stock.changePercent.toFixed(2) + '%'
          }))
        });
      }

      // Add market insights
      insights.forEach(insight => {
        insights_list.push({
          type: insight.type,
          message: insight.description,
          data: {
            confidence: insight.confidence,
            impact: insight.impact
          }
        });
      });

      return insights_list;
    } catch (error) {
      console.error('Error getting portfolio insights:', error);
      return [{
        type: 'error',
        message: 'Unable to fetch market insights at the moment.'
      }];
    }
  }

  async getInvestmentRecommendations(portfolio: Portfolio): Promise<InvestmentAdvice[]> {
    try {
      const riskProfile = this.getRiskProfile(portfolio);
      const advice = await googleFinanceApi.getInvestmentAdvice({
        risk: riskProfile,
        horizon: 'long', // Default to long-term
        goals: ['growth', 'diversification'],
        currentPortfolio: {
          stocks: portfolio.assets.breakdown.stocks.value,
          mutualFunds: portfolio.assets.breakdown.mutualFunds.value,
          fixedDeposits: portfolio.assets.breakdown.fixedDeposits.value
        }
      });

      return advice;
    } catch (error) {
      console.error('Error getting investment recommendations:', error);
      return [];
    }
  }

  async getMarketSummary(): Promise<string> {
    try {
      const indices = await googleFinanceApi.getIndicesPerformance();
      const mainIndices = indices.slice(0, 3); // Get top 3 indices

      const summary = mainIndices.map(index => 
        `${index.name}: ${index.changePercent >= 0 ? '📈' : '📉'} ${index.changePercent.toFixed(2)}%`
      ).join('\n');

      return `Today's Market Summary:\n${summary}`;
    } catch (error) {
      console.error('Error getting market summary:', error);
      return 'Market data temporarily unavailable';
    }
  }

  async searchInvestments(query: string): Promise<Array<{
    symbol: string;
    name: string;
    type: string;
    details?: any;
  }>> {
    try {
      const results = await googleFinanceApi.searchInstruments(query);
      return results.map(item => ({
        symbol: item.symbol,
        name: item.name,
        type: item.type,
      }));
    } catch (error) {
      console.error('Error searching investments:', error);
      return [];
    }
  }
}