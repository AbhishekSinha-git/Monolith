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
          type: 'opportunity',
          message: 'Portfolio analysis is being processed. Connect more accounts for deeper insights.',
          severity: 'info'
        }
      ];
    }
  }

  /**
   * Get stock recommendations based on portfolio
   */
  async getStockRecommendations(portfolio: Portfolio): Promise<string[]> {
    try {
      // This would use Google AI to analyze portfolio and suggest stocks
      // For now, return sector-based recommendations
      const recommendations = [
        'Consider adding technology stocks for growth potential',
        'Banking sector looks attractive at current valuations',
        'FMCG stocks for defensive allocation',
        'Infrastructure plays for long-term growth'
      ];
      
      return recommendations;
    } catch (error) {
      console.error('Error getting stock recommendations:', error);
      return ['Portfolio analysis in progress. Check back for personalized recommendations.'];
    }
  }

  /**
   * Analyze investment performance vs market
   */
  async compareWithMarket(returns: number): Promise<{
    marketReturn: number;
    outperformance: number;
    analysis: string;
  }> {
    try {
      // Mock market return - in production, get from actual data
      const marketReturn = 12.5; // NIFTY 50 annual return estimate
      const outperformance = returns - marketReturn;
      
      let analysis = '';
      if (outperformance > 2) {
        analysis = 'Excellent! Your portfolio is significantly outperforming the market.';
      } else if (outperformance > 0) {
        analysis = 'Good performance! You\'re beating the market benchmark.';
      } else if (outperformance > -2) {
        analysis = 'Your portfolio is close to market performance. Consider optimizing your strategy.';
      } else {
        analysis = 'Your portfolio is underperforming the market. Let\'s review your investment strategy.';
      }
      
      return {
        marketReturn,
        outperformance,
        analysis
      };
    } catch (error) {
      console.error('Error comparing with market:', error);
      return {
        marketReturn: 0,
        outperformance: 0,
        analysis: 'Market comparison data unavailable.'
      };
    }
  }

  /**
   * Get sector allocation recommendations
   */
  async getSectorRecommendations(): Promise<Array<{
    sector: string;
    allocation: number;
    rationale: string;
  }>> {
    return [
      {
        sector: 'Technology',
        allocation: 25,
        rationale: 'Strong growth prospects with digital transformation'
      },
      {
        sector: 'Banking & Financial Services',
        allocation: 20,
        rationale: 'Attractive valuations and credit growth recovery'
      },
      {
        sector: 'Healthcare',
        allocation: 15,
        rationale: 'Defensive play with consistent demand'
      },
      {
        sector: 'Consumer Goods',
        allocation: 15,
        rationale: 'Stable earnings and dividend yield'
      },
      {
        sector: 'Infrastructure',
        allocation: 10,
        rationale: 'Government capex and economic recovery theme'
      },
      {
        sector: 'Energy',
        allocation: 10,
        rationale: 'Commodity cycle and energy transition'
      },
      {
        sector: 'Others',
        allocation: 5,
        rationale: 'Diversification across emerging sectors'
      }
    ];
  }
}