import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const processAuth = async () => {
      console.log('AuthCallback: Processing authentication...');
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
        console.log('AuthCallback: Processing token');
        // Small delay to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        setToken(token);
        console.log('AuthCallback: Token set successfully');
        
        toast({ 
          title: 'Welcome!', 
          description: 'You\'ve successfully signed in.' 
        });
        
        console.log('AuthCallback: Redirecting to dashboard');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('AuthCallback: Token processing error:', error);
        toast({
          title: 'Sign in failed',
          description: 'Failed to process authentication. Please try again.',
          variant: 'destructive'
        });
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [navigate, searchParams, setToken, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card>
        <CardContent className="p-6">Completing sign-in…</CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;


