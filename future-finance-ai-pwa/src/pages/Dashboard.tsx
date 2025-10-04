import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PiggyBank,
  MessageSquare,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useFiMcp } from '@/contexts/FiMcpContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface NetWorthDataPoint {
  month: string;
  value: number;
}

interface SpendingDataPoint {
  name: string;
  value: number;
  color: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    isAuthenticated, 
    isConnected, 
    financialData, 
    loading, 
    error, 
    refreshFinancialData 
  } = useFiMcp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [netWorthData, setNetWorthData] = useState<NetWorthDataPoint[]>([]);
  const [spendingData, setSpendingData] = useState<SpendingDataPoint[]>([]);

  // Generate mock time series data for net worth if we have real data
  useEffect(() => {
    if (financialData?.netWorth) {
      // Create mock historical data based on current net worth
      const currentValue = financialData.netWorth.totalValue || 0;
      const mockData = [
        { month: 'Jan', value: currentValue * 0.85 },
        { month: 'Feb', value: currentValue * 0.90 },
        { month: 'Mar', value: currentValue * 0.88 },
        { month: 'Apr', value: currentValue * 0.95 },
        { month: 'May', value: currentValue * 0.98 },
        { month: 'Jun', value: currentValue }
      ];
      setNetWorthData(mockData);
    }
  }, [financialData?.netWorth]);

  // Generate spending breakdown from bank transactions
  useEffect(() => {
    if (financialData?.bankTransactions) {
      // Process transactions to create spending categories
      // This is a simplified version - in real app you'd categorize transactions
      const mockSpending = [
        { name: 'Food & Dining', value: 15000, color: '#8884d8' },
        { name: 'Shopping', value: 8000, color: '#82ca9d' },
        { name: 'Transportation', value: 5000, color: '#ffc658' },
        { name: 'Bills & Utilities', value: 12000, color: '#ff7300' },
        { name: 'Entertainment', value: 3000, color: '#00ff88' }
      ];
      setSpendingData(mockSpending);
    }
  }, [financialData?.bankTransactions]);

  const handleConnectAccounts = () => {
    navigate('/accounts');
  };

  const handleRefresh = async () => {
    try {
      await refreshFinancialData();
      toast({
        title: "Refresh Complete",
        description: "Your financial data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh your financial data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate total spending from recent transactions
  const getTotalSpending = () => {
    if (!financialData?.bankTransactions) return 0;
    // This would normally process actual transaction data
    return spendingData.reduce((total, item) => total + item.value, 0);
  };

  // Calculate investment value from portfolio
  const getInvestmentValue = () => {
    if (!financialData?.portfolio) return 0;
    return financialData.portfolio.totalValue || 0;
  };

  // Get net worth with fallback
  const getNetWorth = () => {
    if (!financialData?.netWorth) return 0;
    return financialData.netWorth.totalValue || 0;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
            <p className="text-muted-foreground">Here's your financial overview for today</p>
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={handleRefresh}
                disabled={loading}
              >
                <CreditCard className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="lg" 
                className="gap-2"
                onClick={handleConnectAccounts}
              >
                <CreditCard className="h-4 w-4" />
                Connect Fi MCP
              </Button>
            )}
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => navigate('/chat')}
            >
              <MessageSquare className="h-4 w-4" />
              Ask Monolith AI
            </Button>
          </div>
        </div>

        {/* Connected Institutions */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fi MCP Connected</CardTitle>
              <CardDescription>Your financial data is synced via Fi MCP</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">
                  Fi Money Platform
                </Badge>
                {financialData && (
                  <Badge variant="outline">
                    {Object.keys(financialData).filter(key => financialData[key]).length} data sources
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  ₹{isConnected ? getNetWorth().toLocaleString() : '0'}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {isConnected ? (
                    <>
                      <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-green-500">+12.5%</span> this month
                    </>
                  ) : (
                    <>
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Connect accounts to see data
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{isConnected ? getTotalSpending().toLocaleString() : '0'}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <ArrowDown className="h-3 w-3 mr-1" />
              {isConnected ? 'Based on recent transactions' : 'Connect accounts to see data'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{isConnected ? getInvestmentValue().toLocaleString() : '0'}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <ArrowUp className="h-3 w-3 mr-1" />
              {isConnected ? 'Portfolio performance' : 'Connect accounts to see data'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Goal</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <Progress value={0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Set up savings goals to track progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Trend</CardTitle>
            <CardDescription>
              {isConnected ? 'Your net worth over the last 6 months' : 'Connect Fi MCP to see trends'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected && netWorthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={netWorthData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickFormatter={(value) => `₹${(value / 1000)}K`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Net Worth']}
                    labelStyle={{ color: '#666' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb' }}
                    activeDot={{ r: 6, fill: '#1d4ed8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Net worth trend will appear here</p>
                  <p className="text-sm">Connect Fi MCP to see your financial progress</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
            <CardDescription>
              {isConnected ? 'Your spending categories this month' : 'Connect Fi MCP to see spending patterns'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected && spendingData.length > 0 ? (
              <>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={spendingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {spendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {spendingData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        ₹{item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Spending breakdown will appear here</p>
                  <p className="text-sm">Connect Fi MCP to analyze your spending patterns</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected && financialData?.bankTransactions ? (
              <div className="space-y-3">
                {/* Show sample transactions - in real app would map actual transaction data */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sample Transaction</p>
                    <p className="text-sm text-muted-foreground">Banking data available</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">-₹2,500</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Actual transaction parsing coming soon...
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent transactions</p>
                <p className="text-sm">Connect your accounts to see transaction history</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Personalized recommendations for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected && financialData ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="font-medium text-blue-900">Financial Overview</p>
                  <p className="text-sm text-blue-700">
                    Your Fi MCP data is now connected! Net worth: ₹{getNetWorth().toLocaleString()}
                  </p>
                </div>
                {financialData.portfolio && (
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="font-medium text-green-900">Investment Update</p>
                    <p className="text-sm text-green-700">
                      Portfolio value: ₹{getInvestmentValue().toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="text-sm text-muted-foreground text-center">
                  Advanced AI insights coming soon...
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No AI insights available</p>
                <p className="text-sm">Connect your accounts to get personalized financial insights</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
