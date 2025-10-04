import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFiMcp } from '@/contexts/FiMcpContext';
import { FiMcpAuth } from '@/components/FiMcpAuth';
import { 
  Plus, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Smartphone
} from 'lucide-react';

const Accounts = () => {
  const { 
    isAuthenticated, 
    isConnected, 
    financialData, 
    loading, 
    error, 
    refreshFinancialData 
  } = useFiMcp();

  // Calculate metrics from Fi MCP data
  const getTotalBalance = () => {
    if (!financialData?.netWorth) return 0;
    return financialData.netWorth.totalValue || 0;
  };

  const getConnectedDataSources = () => {
    if (!financialData) return 0;
    return Object.keys(financialData).filter(key => financialData[key]).length;
  };

  const getDataFreshness = () => {
    return isConnected ? 95 : 0; // Simple calculation
  };

  const handleRefreshData = async () => {
    try {
      await refreshFinancialData();
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Connected Accounts</h1>
            <p className="text-muted-foreground">Connect to Fi MCP to manage your financial data</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Connect to Fi MCP
            </CardTitle>
            <CardDescription>
              Securely connect your financial accounts through Fi Money's platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FiMcpAuth onAuthSuccess={() => {}} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why Fi MCP?</CardTitle>
            <CardDescription>Benefits of connecting through Fi Money's platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Bank-Grade Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Your data is encrypted and protected with bank-level security
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Real-time Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Get up-to-date information from all your accounts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Multiple Institutions</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect accounts from banks, investments, and EPF
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Easy Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage all your accounts from one dashboard
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Connected Accounts</h1>
          <p className="text-muted-foreground">
            Your financial data is connected through Fi MCP
          </p>
        </div>
        <Button onClick={handleRefreshData} className="gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{getTotalBalance().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              From Fi MCP data sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Sources</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getConnectedDataSources()}</div>
            <p className="text-xs text-muted-foreground">
              Active data connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getDataFreshness()}%</div>
            <Progress value={getDataFreshness()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Data sync status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fi MCP Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Fi MCP Connection
          </CardTitle>
          <CardDescription>Your connection to Fi Money's platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Fi Money Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Connected via MCP • Real-time data sync
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Last synced: Just now
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                Connected
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Data Sources</h2>
        
        <div className="grid gap-4">
          {[
            { 
              key: 'netWorth', 
              name: 'Net Worth', 
              icon: TrendingUp, 
              description: 'Total wealth calculation',
              available: !!financialData?.netWorth
            },
            { 
              key: 'bankTransactions', 
              name: 'Bank Transactions', 
              icon: Building2, 
              description: 'Banking transaction history',
              available: !!financialData?.bankTransactions
            },
            { 
              key: 'creditReport', 
              name: 'Credit Report', 
              icon: CreditCard, 
              description: 'Credit score and history',
              available: !!financialData?.creditReport
            },
            { 
              key: 'portfolio', 
              name: 'Investment Portfolio', 
              icon: TrendingUp, 
              description: 'Stock and mutual fund investments',
              available: !!financialData?.portfolio
            },
            { 
              key: 'epf', 
              name: 'EPF Details', 
              icon: PiggyBank, 
              description: 'Employee Provident Fund data',
              available: !!financialData?.epf
            }
          ].map((source) => {
            const IconComponent = source.icon;
            
            return (
              <Card key={source.key}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        source.available ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`h-6 w-6 ${
                          source.available ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{source.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {source.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {source.available ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Data available</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 text-orange-500" />
                              <span className="text-xs text-orange-600">No data</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={source.available ? "default" : "secondary"}>
                        {source.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Having trouble with your Fi MCP connection?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Refresh Data</h4>
                <p className="text-sm text-muted-foreground">
                  Click the refresh button to update your financial data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Connection Issues</h4>
                <p className="text-sm text-muted-foreground">
                  Re-authenticate if you're experiencing sync problems
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accounts;