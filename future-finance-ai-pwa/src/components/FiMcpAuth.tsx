import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { realFiMcpApi, type FiMcpConnectionStatus, type FiMcpAuthResponse } from '@/api/realFiMcp';
import { useFiMcp } from '@/contexts/FiMcpContext';
import { Loader2, Smartphone, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface FiMcpAuthProps {
  onAuthSuccess: () => void;
}

export const FiMcpAuth: React.FC<FiMcpAuthProps> = ({ onAuthSuccess }) => {
  const { setAuthenticated, setFinancialData } = useFiMcp();
  const [connectionStatus, setConnectionStatus] = useState<FiMcpConnectionStatus | null>(null);
  const [authStep, setAuthStep] = useState<'phone' | 'passcode' | 'authenticated'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await realFiMcpApi.getConnectionStatus();
      if (response.success && response.data) {
        setConnectionStatus(response.data);
        if (response.data.authenticated) {
          setAuthStep('authenticated');
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const initializeFiMcp = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await realFiMcpApi.initialize();
      if (response.success) {
        setSuccess('✅ Connected to Fi MCP Server');
        // Update connection status to show we're connected
        setConnectionStatus({
          connected: true,
          authenticated: false
        });
        // Also check status from backend
        await checkConnectionStatus();
      } else {
        setError(response.error || 'Failed to initialize Fi MCP');
      }
    } catch (error) {
      setError('Failed to connect to Fi MCP Server');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await realFiMcpApi.authenticateWithPhone(phoneNumber);
      if (response.success) {
        // Backend returns authResult spread directly in response, not in response.data
        const authData: FiMcpAuthResponse = response.data || response as any;
        
        if (authData.status === 'pending') {
          setAuthStep('passcode');
          setLoginUrl(authData.loginUrl || '');
          setSuccess('📱 Please get your passcode from the Fi Money app');
        } else if (authData.status === 'authenticated') {
          setAuthStep('authenticated');
          setSuccess('✅ Authentication successful!');
          
          // Store financial data in context if available
          if ((authData as any).financialData) {
            setFinancialData((authData as any).financialData);
          }
          
          setAuthenticated(true);
          onAuthSuccess();
        } else {
          setError('Authentication failed. Please try again.');
        }
      } else {
        setError(response.error || 'Authentication failed');
      }
    } catch (error) {
      setError('Authentication request failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeVerification = async () => {
    if (!passcode || passcode.length < 4) {
      setError('Please enter the passcode from your Fi Money app');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await realFiMcpApi.verifyPasscode(phoneNumber, passcode);
      console.log('🔍 Passcode verification response:', response);
      
      if (response.success) {
        // Backend spreads the result directly into the response
        const authResponse = response as any;
        
        if (authResponse.status === 'authenticated') {
          setAuthStep('authenticated');
          setSuccess('✅ Authentication successful! Your financial data is now connected.');
          
          // Store financial data in context if available
          if (authResponse.financialData) {
            setFinancialData(authResponse.financialData);
          }
          
          setAuthenticated(true);
          onAuthSuccess();
        } else if (authResponse.status === 'failed') {
          // Check if we need to show login URL
          if (authResponse.loginUrl) {
            setLoginUrl(authResponse.loginUrl);
            setError(`${authResponse.message} Please click the login link below first.`);
          } else {
            setError(authResponse.message || 'Invalid passcode. Please check and try again.');
          }
        } else {
          setError('Invalid passcode. Please check and try again.');
        }
      } else {
        setError(response.error || 'Passcode verification failed');
      }
    } catch (error) {
      console.error('❌ Passcode verification error:', error);
      setError('Passcode verification failed');
    } finally {
      setLoading(false);
    }
  };

  const renderConnectionStatus = () => {
    if (!connectionStatus) return null;

    return (
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={connectionStatus.connected ? 'default' : 'destructive'}>
          {connectionStatus.connected ? (
            <><CheckCircle className="w-3 h-3 mr-1" /> Connected</>
          ) : (
            <><AlertCircle className="w-3 h-3 mr-1" /> Disconnected</>
          )}
        </Badge>
        <Badge variant={connectionStatus.authenticated ? 'default' : 'secondary'}>
          {connectionStatus.authenticated ? (
            <><Shield className="w-3 h-3 mr-1" /> Authenticated</>
          ) : (
            <><Shield className="w-3 h-3 mr-1" /> Not Authenticated</>
          )}
        </Badge>
      </div>
    );
  };

  if (authStep === 'authenticated') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-700">Fi MCP Connected</CardTitle>
          <CardDescription>
            Your financial data is securely connected through Fi Money's MCP Server
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderConnectionStatus()}
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ Real-time access to 18+ financial sources</p>
            <p>✅ Assets, liabilities, and net worth data</p>
            <p>✅ Portfolio performance and analytics</p>
            <p>✅ AI-powered financial insights</p>
          </div>
          <Button 
            onClick={onAuthSuccess} 
            className="w-full mt-4"
            variant="default"
          >
            Continue to AI Assistant
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Connect Fi MCP</CardTitle>
        <CardDescription>
          Connect to Fi Money's MCP Server for real-time financial insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderConnectionStatus()}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!connectionStatus?.connected && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              First, let's establish connection to Fi MCP Server
            </p>
            <Button 
              onClick={initializeFiMcp} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initialize Fi MCP Connection
            </Button>
          </div>
        )}

        {connectionStatus?.connected && authStep === 'phone' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Fi Money Registered Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>
            <Button 
              onClick={handlePhoneAuth} 
              disabled={loading || !phoneNumber || phoneNumber.length !== 10}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Authentication
            </Button>
          </div>
        )}

        {authStep === 'passcode' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium mb-2">📱 Get Passcode from Fi Money App:</p>
              <ol className="text-xs text-gray-600 space-y-1">
                <li>1. Open Fi Money app</li>
                <li>2. Go to Net Worth Dashboard</li>
                <li>3. Tap "Talk to AI"</li>
                <li>4. Tap "Get Passcode"</li>
                <li>5. Copy the passcode and enter below</li>
              </ol>
              {loginUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => window.open(loginUrl, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open Fi Money Login
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="passcode" className="text-sm font-medium">
                Enter Passcode from Fi Money App
              </label>
              <Input
                id="passcode"
                type="text"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.trim())}
                maxLength={20}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setAuthStep('phone')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handlePasscodeVerification} 
                disabled={loading || !passcode}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            🔒 Your data is securely accessed through Fi Money's MCP Server. 
            No credentials are stored on our servers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};