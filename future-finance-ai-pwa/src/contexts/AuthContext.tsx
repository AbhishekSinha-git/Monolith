import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/api/auth';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);

  const setToken = (newToken: string | null) => {
    console.log('AuthContext: Setting token:', newToken ? 'Present' : 'Null');
    setTokenState(newToken);

    if (newToken) {
      localStorage.setItem('authToken', newToken);
      try {
        const parts = newToken.split('.');
        console.log('AuthContext: Token parts:', parts.length);
        
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          console.log('AuthContext: Decoded token:', decoded);
          
          // Create user data from token
          const userData = {
            id: decoded.sub || decoded.id || '',
            name: decoded.name || '',
            email: decoded.email || '',
            avatar: decoded.picture || ''
          };
          
          console.log('AuthContext: Setting user data:', userData);
          setUser(userData);
          return; // Successfully set user
        }
      } catch (e) {
        console.error("AuthContext: Token decode error:", e);
      }
      
      // If we get here, something went wrong
      console.error("AuthContext: Invalid token format");
      localStorage.removeItem('authToken');
      setUser(null);
    } else {
      console.log('AuthContext: Clearing auth state');
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Verify token with backend and hydrate on app start
  useEffect(() => {
    const verify = async () => {
      const current = localStorage.getItem('authToken');
      if (!current) return;
      try {
        const session = await authApi.getSession();
        if (session?.isAuthenticated && session.user) {
          setUser({
            id: (session.user as any).sub || (session.user as any).id || '',
            name: (session.user as any).name || '',
            email: (session.user as any).email || '',
            avatar: (session.user as any).picture || (session.user as any).avatarUrl || '',
          });
        } else {
          setToken(null);
        }
      } catch {
        setToken(null);
      }
    };
    verify();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Real backend login - implement when backend supports email/password auth
      throw new Error('Email/password login not implemented. Please use Google Sign-In.');
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    token,
    setToken,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
