

import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { Navigation } from './Navigation';

export const Layout = () => {
  const { isAuthenticated, user, token } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log('Layout: Auth State:', { 
    isAuthenticated, 
    hasUser: !!user, 
    hasToken: !!token,
    user
  });
  
  if (!isAuthenticated || !user) {
    console.log('Layout: Access denied, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Layout: Access granted, rendering protected content');

  const handleMenuToggle = () => {
    console.log('Menu toggle clicked, current state:', isMobileMenuOpen);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    console.log('Menu close called');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} />
      <div className="flex">
        <Navigation isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

