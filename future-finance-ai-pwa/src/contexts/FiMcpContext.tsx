import React, { createContext, useContext, useState, useEffect } from 'react';
import { realFiMcpApi } from '@/api/realFiMcp';

interface FiMcpData {
  netWorth: any;
  bankTransactions: any;
  creditReport: any;
  portfolio: any;
  epf: any;
}

interface FiMcpContextType {
  isAuthenticated: boolean;
  isConnected: boolean;
  financialData: FiMcpData | null;
  loading: boolean;
  error: string | null;
  setAuthenticated: (authenticated: boolean) => void;
  setFinancialData: (data: FiMcpData) => void;
  refreshFinancialData: () => Promise<void>;
}

const FiMcpContext = createContext<FiMcpContextType | undefined>(undefined);

export const FiMcpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [financialData, setFinancialData] = useState<FiMcpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkFiMcpStatus();
  }, []);

  const checkFiMcpStatus = async () => {
    try {
      const response = await realFiMcpApi.getConnectionStatus();
      if (response.success && response.data) {
        setIsConnected(response.data.connected);
        setIsAuthenticated(response.data.authenticated);
      }
    } catch (error) {
      console.error('Error checking Fi MCP status:', error);
    }
  };

  const refreshFinancialData = async () => {
    if (!isAuthenticated) {
      setError('Not authenticated with Fi MCP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await realFiMcpApi.getFinancialData();
      if (response.success && response.data) {
        // The API returns FiMcpData structure from the backend
        setFinancialData(response.data as any);
      } else {
        setError(response.error || 'Failed to fetch financial data');
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError('Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  const setAuthenticated = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    if (authenticated) {
      refreshFinancialData();
    }
  };

  return (
    <FiMcpContext.Provider
      value={{
        isAuthenticated,
        isConnected,
        financialData,
        loading,
        error,
        setAuthenticated,
        setFinancialData,
        refreshFinancialData
      }}
    >
      {children}
    </FiMcpContext.Provider>
  );
};

export const useFiMcp = () => {
  const context = useContext(FiMcpContext);
  if (context === undefined) {
    throw new Error('useFiMcp must be used within a FiMcpProvider');
  }
  return context;
};
