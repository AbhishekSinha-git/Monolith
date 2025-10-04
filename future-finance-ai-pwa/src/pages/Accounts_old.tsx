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
          <p className="text-muted-foreground">Manage your financial accounts and data sources</p>
        </div>
        <Button onClick={handleAddAccount} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading your accounts...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">{error}</div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No accounts connected yet.</p>
            <p className="text-muted-foreground">Click "Add Account" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all connected accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connectedAccounts}</div>
                <p className="text-xs text-muted-foreground">
                  Out of {accounts.length} total accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98%</div>
                <Progress value={98} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Data sync health score
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Accounts List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Accounts</h2>
            
            <div className="grid gap-4">
              {accounts.map((account) => {
                const IconComponent = getAccountIcon(account.type);
                
                return (
                  <Card key={account.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-lg">
                            <IconComponent className="h-6 w-6" />
                          </div>
                          
                          <div>
                            <h3 className="font-semibold">{account.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {account.institution} • {account.accountNumber}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(account.status)}
                              <span className="text-xs text-muted-foreground">
                                Last synced {account.lastSync}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(account.status)}
                          </div>
                          
                          <div className={`text-lg font-semibold ${
                            account.balance < 0 ? 'text-red-600' : 'text-foreground'
                          }`}>
                            {account.balance < 0 ? '-' : ''}₹
                            {Math.abs(account.balance).toLocaleString('en-IN', { 
                              minimumFractionDigits: 2 
                            })}
                          </div>
                          
                          <div className="flex gap-1 mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRefresh(account.id)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSettings(account.id)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Add Account Section */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Account</CardTitle>
              <CardDescription>
                Connect more accounts to get a complete picture of your finances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'HDFC Bank', logo: '🏦' },
                  { name: 'ICICI Bank', logo: '�️' },
                  { name: 'Axis Bank', logo: '💳' },
                  { name: 'SBI', logo: '�' },
                  { name: 'Kotak Bank', logo: '🏛️' },
                  { name: 'NSDL', logo: '�' },
                  { name: 'CDSL', logo: '📊' },
                  { name: 'EPFO', logo: '�' },
                ].map((institution, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-16 flex flex-col gap-2"
                    onClick={handleAddAccount}
                  >
                    <span className="text-2xl">{institution.logo}</span>
                    <span className="text-xs">{institution.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Accounts;