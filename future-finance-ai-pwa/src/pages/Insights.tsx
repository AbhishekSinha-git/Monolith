
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Calendar,
  Download,
  Share,
  Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

const spendingTrendData = [
  { month: 'Jan', amount: 2100 },
  { month: 'Feb', amount: 2300 },
  { month: 'Mar', amount: 1950 },
  { month: 'Apr', amount: 2400 },
  { month: 'May', amount: 2200 },
  { month: 'Jun', amount: 2250 },
];

const categorySpendingData = [
  { category: 'Housing', amount: 1200, budget: 1300, percentage: 92 },
  { category: 'Food', amount: 400, budget: 450, percentage: 89 },
  { category: 'Transport', amount: 300, budget: 350, percentage: 86 },
  { category: 'Entertainment', amount: 200, budget: 180, percentage: 111 },
  { category: 'Healthcare', amount: 150, budget: 200, percentage: 75 },
];

const investmentPerformanceData = [
  { month: 'Jan', portfolio: 15000, benchmark: 15200 },
  { month: 'Feb', portfolio: 15800, benchmark: 15600 },
  { month: 'Mar', portfolio: 16200, benchmark: 15900 },
  { month: 'Apr', portfolio: 17100, benchmark: 16500 },
  { month: 'May', portfolio: 17800, benchmark: 17200 },
  { month: 'Jun', portfolio: 18500, benchmark: 17800 },
];

const Insights = () => {
  const insights = [
    {
      id: 1,
      type: 'opportunity',
      title: 'Reduce Subscription Costs',
      description: 'You have 8 active subscriptions totaling $127/month. Cancel unused ones to save $45/month.',
      impact: '$540/year',
      priority: 'high',
      category: 'Spending'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Entertainment Budget Exceeded',
      description: 'You\'ve spent 111% of your entertainment budget this month.',
      impact: '$20 over budget',
      priority: 'medium',
      category: 'Budget'
    },
    {
      id: 3,
      type: 'success',
      title: 'Investment Performance',
      description: 'Your portfolio is outperforming the market benchmark by 3.9%.',
      impact: '+$700 this month',
      priority: 'low',
      category: 'Investments'
    },
    {
      id: 4,
      type: 'opportunity',
      title: 'Emergency Fund Goal',
      description: 'You\'re 68% towards your emergency fund goal. Consider increasing monthly contributions.',
      impact: '$3,200 remaining',
      priority: 'medium',
      category: 'Savings'
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Insights</h1>
          <p className="text-muted-foreground">Discover opportunities to improve your financial health</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <Share className="h-4 w-4" />
            Share
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
        <div className="grid gap-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        {getPriorityBadge(insight.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{insight.category}</Badge>
                        <span className={`text-sm font-medium ${
                          insight.type === 'success' ? 'text-green-600' : 
                          insight.type === 'warning' ? 'text-amber-600' : 
                          'text-blue-600'
                        }`}>
                          {insight.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Take Action
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="spending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="spending" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending Trend</CardTitle>
                <CardDescription>Your monthly spending over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={spendingTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Spending']} />
                    <Area type="monotone" dataKey="amount" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>How you're spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySpendingData.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm text-muted-foreground">
                          ${category.amount} / ${category.budget}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            category.percentage > 100 ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.percentage}% used</span>
                        <span className={category.percentage > 100 ? 'text-red-600' : ''}>
                          {category.percentage > 100 ? 'Over budget' : 'On track'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Performance</CardTitle>
              <CardDescription>Track your budget vs actual spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categorySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="budget" fill="#e5e7eb" name="Budget" />
                  <Bar dataKey="amount" fill="#2563eb" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Performance</CardTitle>
              <CardDescription>Portfolio vs market benchmark</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={investmentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, '']} />
                  <Line type="monotone" dataKey="portfolio" stroke="#2563eb" strokeWidth={2} name="Your Portfolio" />
                  <Line type="monotone" dataKey="benchmark" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Market Benchmark" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Fund</CardTitle>
                <CardDescription>3-6 months of expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Progress</span>
                    <span className="font-medium">$6,800 / $10,000</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: '68%' }} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    68% complete • $3,200 remaining
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retirement Savings</CardTitle>
                <CardDescription>401(k) + IRA contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Annual Goal</span>
                    <span className="font-medium">$12,000 / $15,000</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '80%' }} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    80% complete • $3,000 remaining
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Insights;
