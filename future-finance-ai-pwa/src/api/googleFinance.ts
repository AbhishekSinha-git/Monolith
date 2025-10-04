import { http } from '@/api/client';

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdated: string;
}

export interface MarketInsight {
  type: 'trend' | 'news' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  source: string;
  timestamp: string;
}

export interface InvestmentAdvice {
  suggestion: string;
  rationale: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
  potentialReturn: {
    min: number;
    max: number;
    timeframe: string;
  };
}

// Types for index performance
export interface IndexPerformance {
  name: string;
  current: number;
  change: number;
  changePercent: number;
  currency: string;
}

export const googleFinanceApi = {
  // Get real-time market data for symbols
  getMarketData: (symbols: string[]) => 
    http.get<MarketData[]>('/api/google/finance/quotes', { 
      params: { symbols: symbols.join(',') }
    }),

  // Get market insights based on user's portfolio
  getMarketInsights: (portfolio: Record<string, number>) =>
    http.post<MarketInsight[]>('/api/google/finance/insights', { portfolio }),

  // Get investment advice based on profile and goals
  getInvestmentAdvice: (params: {
    risk: 'low' | 'medium' | 'high';
    horizon: string;
    goals: string[];
    currentPortfolio: Record<string, number>;
  }) => http.post<InvestmentAdvice[]>('/api/google/finance/advice', params),

  // Get major market indices performance
  getIndicesPerformance: () =>
    http.get<IndexPerformance[]>('/api/google/finance/indices'),

  // Search for investment instruments
  searchInstruments: (query: string, type?: 'stock' | 'mutualfund' | 'etf') =>
    http.get<Array<{
      symbol: string;
      name: string;
      type: string;
      exchange: string;
    }>>('/api/google/finance/search', { 
      params: { query, type } 
    }),

  // Get historical performance data
  getHistoricalData: (symbol: string, period: 'day' | 'week' | 'month' | 'year') =>
    http.get<Array<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>>(`/api/google/finance/historical/${symbol}`, { 
      params: { period } 
    }),

  // Get sector performance
  getSectorPerformance: () =>
    http.get<Array<{
      sector: string;
      performance: number;
      momentum: number;
      topPerformers: string[];
    }>>('/api/google/finance/sectors'),
  
  // Get market news
  getMarketNews: (categories?: string[]) =>
    http.get<Array<{
      id: string;
      title: string;
      summary: string;
      url: string;
      source: string;
      timestamp: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      impactedSymbols: string[];
    }>>('/api/google/finance/news', { 
      params: categories ? { categories: categories.join(',') } : undefined 
    }),
};