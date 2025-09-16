
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Chrome } from 'lucide-react';
import { authApi } from '@/api/auth';

const Login = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = () => {
    try {
      authApi.googleAuth();
    } catch (error) {
      console.error('Failed to start Google OAuth:', error);
      toast({
        title: "Login failed",
        description: "Failed to start Google authentication. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold">Welcome to Monolith</h1>
          <p className="text-muted-foreground mt-2">
            Your intelligent personal finance assistant
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Access your financial dashboard with secure Google authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn}>
                <Chrome className="h-4 w-4" />
                Continue with Google
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Secure authentication powered by Google OAuth
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure • Private • AI-Powered</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
