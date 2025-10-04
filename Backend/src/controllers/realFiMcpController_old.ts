import { Request, Response } from 'express';
import { FiMcpClient } from '../services/fiMcpClient';

// Global Fi MCP client instance
let fiMcpClient: FiMcpClient;

/**
 * Initialize Fi MCP Service
 */
export const initializeFiMcp = async (req: Request, res: Response) => {
  try {
    console.log('🚀 Initializing Fi MCP Client...');
    
    fiMcpClient = new FiMcpClient();
    await fiMcpClient.initialize();
    
    res.status(200).json({
      success: true,
      message: 'Fi MCP Client initialized successfully',
      status: fiMcpClient.getConnectionStatus()
    });
  } catch (error) {
    console.error('❌ Failed to initialize Fi MCP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Fi MCP Service',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Start authentication process with phone number
 */
export const authenticateUser = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    console.log('🔐 Starting authentication for:', phoneNumber);
    const authResult = await fiMcpClient.authenticateWithPhone(phoneNumber);
    
    res.status(200).json({
      success: true,
      ...authResult
    });
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Verify passcode from Fi Money app
 */
export const verifyPasscode = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, passcode } = req.body;
    
    if (!phoneNumber || !passcode) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and passcode are required'
      });
    }

    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    console.log('🔑 Verifying passcode for:', phoneNumber);
    const result = await fiMcpClient.verifyPasscode(phoneNumber, passcode);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Passcode verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Passcode verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get complete financial data
 */
export const getFinancialData = async (req: Request, res: Response) => {
  try {
    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    console.log('📊 Fetching financial data...');
    const data = await fiMcpService.getFinancialData();
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error fetching financial data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get net worth history
 */
export const getNetWorthHistory = async (req: Request, res: Response) => {
  try {
    const { period = '6m' } = req.query;
    
    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    const history = await fiMcpService.getNetWorthHistory(period as '1m' | '3m' | '6m' | '1y');
    
    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error('❌ Error fetching net worth history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch net worth history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get portfolio performance
 */
export const getPortfolioPerformance = async (req: Request, res: Response) => {
  try {
    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    const performance = await fiMcpService.getPortfolioPerformance();
    
    res.status(200).json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('❌ Error fetching portfolio performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio performance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get underperforming investments
 */
export const getUnderperformingInvestments = async (req: Request, res: Response) => {
  try {
    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    const underperforming = await fiMcpService.getUnderperformingInvestments();
    
    res.status(200).json({
      success: true,
      underperforming
    });
  } catch (error) {
    console.error('❌ Error fetching underperforming investments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch underperforming investments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Calculate loan affordability
 */
export const calculateAffordability = async (req: Request, res: Response) => {
  try {
    const { loanAmount, loanType } = req.body;
    
    if (!loanAmount || !loanType) {
      return res.status(400).json({
        success: false,
        error: 'Loan amount and type are required'
      });
    }

    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    const affordability = await fiMcpService.calculateAffordability(loanAmount, loanType);
    
    res.status(200).json({
      success: true,
      affordability
    });
  } catch (error) {
    console.error('❌ Error calculating affordability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate affordability',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Project net worth
 */
export const projectNetWorth = async (req: Request, res: Response) => {
  try {
    const { targetAge, currentAge, monthlyInvestment } = req.body;
    
    if (!targetAge || !currentAge) {
      return res.status(400).json({
        success: false,
        error: 'Target age and current age are required'
      });
    }

    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    const projection = await fiMcpService.projectNetWorth(targetAge, currentAge, monthlyInvestment);
    
    res.status(200).json({
      success: true,
      projection
    });
  } catch (error) {
    console.error('❌ Error projecting net worth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to project net worth',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Detect financial anomalies
 */
export const detectAnomalies = async (req: Request, res: Response) => {
  try {
    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    const anomalies = await fiMcpService.detectAnomalies();
    
    res.status(200).json({
      success: true,
      anomalies
    });
  } catch (error) {
    console.error('❌ Error detecting anomalies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect anomalies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get connection status
 */
export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    if (!fiMcpService) {
      return res.status(200).json({
        success: true,
        status: {
          connected: false,
          authenticated: false,
          message: 'Fi MCP Service not initialized'
        }
      });
    }

    const status = fiMcpService.getConnectionStatus();
    
    res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('❌ Error getting connection status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connection status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Process AI query with Fi MCP data
 */
export const processAIQuery = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    if (!fiMcpService) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Service not initialized'
      });
    }

    // Get financial data for AI processing
    const financialData = await fiMcpService.getFinancialData();
    
    // Here you would integrate with Gemini AI
    // For now, return a structured response based on query type
    let response = '';
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('net worth')) {
      const netWorth = financialData.netWorth.current;
      response = `Your current net worth is ₹${(netWorth / 100000).toFixed(1)}L. `;
      
      const history = await fiMcpService.getNetWorthHistory('6m');
      if (history.length > 1) {
        const growth = netWorth - history[0].netWorth;
        const growthPercent = (growth / history[0].netWorth) * 100;
        response += `It has ${growth >= 0 ? 'grown' : 'decreased'} by ₹${Math.abs(growth / 100000).toFixed(1)}L (${growthPercent.toFixed(1)}%) over the last 6 months.`;
      }
    } else if (lowerQuery.includes('afford') && lowerQuery.includes('loan')) {
      const amount = extractAmount(query);
      if (amount > 0) {
        const affordability = await fiMcpService.calculateAffordability(amount, 'home');
        response = `${affordability.affordable ? 'Yes' : 'No'}, you ${affordability.affordable ? 'can' : 'cannot'} afford a ₹${(amount / 100000).toFixed(1)}L loan. Your estimated EMI would be ₹${(affordability.estimatedEmi / 1000).toFixed(0)}K. ${affordability.recommendation}`;
      }
    } else if (lowerQuery.includes('underperform')) {
      const underperforming = await fiMcpService.getUnderperformingInvestments();
      if (underperforming.length > 0) {
        response = `You have ${underperforming.length} underperforming investment(s):\n`;
        underperforming.forEach((inv, i) => {
          response += `${i + 1}. ${inv.name} (${inv.type}): ${inv.returns.toFixed(1)}% returns vs ${inv.benchmark} benchmark. ${inv.recommendation}\n`;
        });
      } else {
        response = 'Great news! None of your investments are significantly underperforming the market.';
      }
    } else if (lowerQuery.includes('will i have') && lowerQuery.includes('40')) {
      const projection = await fiMcpService.projectNetWorth(40, 30); // Assuming current age 30
      response = `Based on your current financial profile and investment patterns, you're projected to have ₹${(projection.projectedNetWorth / 10000000).toFixed(1)} crore by age 40. To optimize this, consider investing ₹${(projection.requiredMonthlyInvestment / 1000).toFixed(0)}K monthly.`;
    } else {
      response = 'I can help you with questions about your net worth, loan affordability, investment performance, and financial projections. Try asking: "How much money will I have at 40?" or "Can I afford a ₹50L home loan?"';
    }
    
    res.status(200).json({
      success: true,
      response,
      financialContext: {
        netWorth: financialData.netWorth.current,
        portfolioReturns: financialData.performance.portfolioReturns,
        creditScore: financialData.creditScore.score
      }
    });
  } catch (error) {
    console.error('❌ Error processing AI query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to extract amount from text
function extractAmount(text: string): number {
  const match = text.match(/₹(\d+(?:\.\d+)?)\s*([LlCc]?)/);
  if (match) {
    const amount = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();
    if (unit === 'l') return amount * 100000; // Lakh
    if (unit === 'c') return amount * 10000000; // Crore
    return amount;
  }
  return 0;
}