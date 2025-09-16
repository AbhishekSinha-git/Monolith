

import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  CreditCard, 
  TrendingUp, 
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/chat', icon: MessageSquare },
  { name: 'Accounts', href: '/accounts', icon: CreditCard },
  { name: 'Insights', href: '/insights', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface NavigationProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Navigation = ({ isOpen = false, onClose }: NavigationProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Navigation sidebar */}
      <nav className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col flex-1 min-h-0 pt-4 pb-4">
          {/* Mobile close button */}
          <div className="flex items-center justify-end px-4 pb-2 lg:hidden">
            <button
              onClick={onClose}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col">
            <ul className="flex-1 px-3 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )
                    }
                    onClick={(e) => {
                      console.log('Navigation clicked:', item.name, 'to:', item.href);
                      // Close mobile menu when link is clicked
                      if (onClose) {
                        onClose();
                      }
                    }}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

