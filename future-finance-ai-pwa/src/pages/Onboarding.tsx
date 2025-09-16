import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect your data</CardTitle>
          <CardDescription>
            Securely connect your financial accounts via Fi MCP and grant permissions for insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>Choose providers to connect</li>
            <li>Review requested scopes (assets, liabilities, net worth, credit score, EPF)</li>
            <li>Control access and revoke anytime</li>
          </ul>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/accounts')}>Open Connections</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Skip for now</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;


