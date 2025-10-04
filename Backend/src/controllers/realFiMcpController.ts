import { Request, Response } from 'express';
import { FiMcpClient } from '../services/fiMcpClient';

// Global Fi MCP client instance
let fiMcpClient: FiMcpClient;

/**
 * Initialize Fi MCP Client
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
      error: 'Failed to initialize Fi MCP Client',
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

    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
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
 * Verify passcode from Fi Money app and fetch initial data
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
    
    // If authenticated successfully, fetch all financial data
    if (result.status === 'authenticated') {
      try {
        console.log('📦 Fetching all financial data after authentication...');
        const financialData = await fiMcpClient.fetchAllFinancialData();
        
        res.status(200).json({
          success: true,
          ...result,
          financialData
        });
      } catch (dataError) {
        // Authentication succeeded but data fetch failed
        console.error('⚠️ Data fetch failed after authentication:', dataError);
        res.status(200).json({
          success: true,
          ...result,
          financialData: null,
          dataFetchError: 'Authentication successful but failed to fetch some financial data'
        });
      }
    } else {
      res.status(200).json({
        success: true,
        ...result
      });
    }
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
 * Get all financial data (after authentication)
 */
export const getAllFinancialData = async (req: Request, res: Response) => {
  try {
    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    console.log('� Fetching all financial data...');
    const data = await fiMcpClient.fetchAllFinancialData();
    
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
    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    const answer = await fiMcpClient.query("Show me my net worth history for the past 6 months with monthly breakdowns");
    
    res.status(200).json({
      success: true,
      history: answer
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
    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    const performance = await fiMcpClient.getPortfolioPerformance();
    
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
    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    const underperforming = await fiMcpClient.getUnderperformingInvestments();
    
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

    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    const affordability = await fiMcpClient.calculateAffordability(loanAmount, loanType);
    
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
    const { targetAge, currentAge } = req.body;
    
    if (!targetAge || !currentAge) {
      return res.status(400).json({
        success: false,
        error: 'Target age and current age are required'
      });
    }

    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    const projection = await fiMcpClient.projectNetWorth(targetAge, currentAge);
    
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
    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    const anomalies = await fiMcpClient.detectAnomalies();
    
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
    if (!fiMcpClient) {
      return res.status(200).json({
        success: true,
        status: {
          connected: false,
          authenticated: false,
          message: 'Fi MCP Client not initialized'
        }
      });
    }

    const status = fiMcpClient.getConnectionStatus();
    
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

    if (!fiMcpClient) {
      return res.status(500).json({
        success: false,
        error: 'Fi MCP Client not initialized'
      });
    }

    console.log('💬 Processing AI query:', query);
    
    // Query Fi MCP directly - it will handle the natural language processing
    const response = await fiMcpClient.query(query);
    
    res.status(200).json({
      success: true,
      data: {
        response,
        financialContext: {
          netWorth: 0, // Fi MCP will provide this in the response
          portfolioReturns: { cagr: 0, xirr: 0, ytd: 0 },
          creditScore: 0
        }
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