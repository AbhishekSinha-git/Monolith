import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { mcpApi } from '@/api/mcp';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const processAuth = async () => {
      console.log('AuthCallback: Processing callback...');
      
      // Handle MCP connection callback
      const mcpCode = searchParams.get('mcp_code');
      if (mcpCode) {
        try {
          await mcpApi.completeConnection(mcpCode);
          toast({
            title: 'Banks Connected',
            description: 'Successfully connected your bank accounts.',
          });
          navigate('/accounts', { replace: true });
          return;
        } catch (error) {
          console.error('Failed to complete MCP connection:', error);
          toast({
            title: 'Connection Failed',
            description: 'Failed to connect bank accounts. Please try again.',
            variant: 'destructive'
          });
          navigate('/accounts', { replace: true });
          return;
        }
      }

      // Handle OAuth callback
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      console.log('AuthCallback: Received params:', {
        hasToken: !!token,
        error: error || 'none'
      });

      if (error) {
        const errorMessage = error === 'auth_failed'
          ? 'Authentication failed. Please try again.'
          : 'An error occurred during sign in. Please try again.';
        
        console.log('AuthCallback: Error flow -', errorMessage);
        toast({
          title: 'Sign in failed',
          description: errorMessage,
          variant: 'destructive'
        });
        navigate('/login', { replace: true });
        return;
      }

      if (!token) {
        console.log('AuthCallback: No token received');
        toast({
          title: 'Sign in failed',
          description: 'No authentication token received. Please try again.',
          variant: 'destructive'
        });
        navigate('/login', { replace: true });
        return;
      }

      try {
        console.log('AuthCallback: Setting token and redirecting');
        setToken(token);
        toast({ 
          title: 'Welcome!', 
          description: 'You\'ve successfully signed in.' 
        });
        navigate('/', { replace: true });
      } catch (error) {
        console.error('AuthCallback: Error setting token -', error);
        toast({
          title: 'Sign in failed',
          description: 'Failed to complete sign in. Please try again.',
          variant: 'destructive'
        });
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [navigate, searchParams, setToken, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card>
        <CardContent className="py-12 px-8">
          <div className="flex items-center justify-center gap-4">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
            <p>Processing your request...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;


