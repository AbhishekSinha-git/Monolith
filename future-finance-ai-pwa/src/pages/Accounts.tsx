
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit' | 'investment' | 'savings';
  balance: number;
  status: 'connected' | 'error' | 'syncing';
  lastSync: string;
  institution: string;
  accountNumber: string;
}

const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Chase Checking',
    type: 'bank',
    balance: 3250.80,
    status: 'connected',
    lastSync: '2 minutes ago',
    institution: 'Chase Bank',
    accountNumber: '****1234'
  },
  {
    id: '2',
    name: 'Chase Savings',
    type: 'savings',
    balance: 12500.00,
    status: 'connected',
    lastSync: '2 minutes ago',
    institution: 'Chase Bank',
    accountNumber: '****5678'
  },
  {
    id: '3',
    name: 'Capital One Credit Card',
    type: 'credit',
    balance: -850.32,
    status: 'connected',
    lastSync: '5 minutes ago',
    institution: 'Capital One',
    accountNumber: '****9012'
  },
  {
    id: '4',
    name: 'Fidelity 401(k)',
    type: 'investment',
    balance: 45200.15,
    status: 'connected',
    lastSync: '1 hour ago',
    institution: 'Fidelity',
    accountNumber: '****3456'
  },
  {
    id: '5',
    name: 'Robinhood Investment',
    type: 'investment',
    balance: 8750.25,
    status: 'error',
    lastSync: '2 days ago',
    institution: 'Robinhood',
    accountNumber: '****7890'
  }
];

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);

  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'bank':
        return Building2;
      case 'credit':
        return CreditCard;
      case 'savings':
        return PiggyBank;
      case 'investment':
        return TrendingUp;
      default:
        return Building2;
    }
  };

  const getStatusIcon = (status: Account['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: Account['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Connection Error</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Syncing</Badge>;
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const connectedAccounts = accounts.filter(account => account.status === 'connected').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Connected Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts and data sources</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                        {account.balance < 0 ? '-' : ''}$
                        {Math.abs(account.balance).toLocaleString('en-US', { 
                          minimumFractionDigits: 2 
                        })}
                      </div>
                      
                      <div className="flex gap-1 mt-2">
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
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
              { name: 'Bank of America', logo: '🏦' },
              { name: 'Wells Fargo', logo: '🏛️' },
              { name: 'American Express', logo: '💳' },
              { name: 'Vanguard', logo: '📈' },
            ].map((institution, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-16 flex flex-col gap-2"
              >
                <span className="text-2xl">{institution.logo}</span>
                <span className="text-xs">{institution.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accounts;
