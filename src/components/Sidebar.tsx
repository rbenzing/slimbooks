
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings as SettingsIcon,
  CreditCard,
  LogOut,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'clients', name: 'Clients', icon: Users, path: '/clients' },
  { 
    id: 'invoices', 
    name: 'Invoices', 
    icon: FileText, 
    path: '/invoices',
    subItems: [
      { id: 'sent-invoices', name: 'Sent Invoices', path: '/invoices#invoices' },
      { id: 'recurring-templates', name: 'Recurring Templates', path: '/invoices#templates' }
    ]
  },
  { id: 'settings', name: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path.includes('#')) {
      return location.pathname + location.hash === path;
    }
    return location.pathname.startsWith(path);
  };

  const isParentActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-full bg-white shadow-lg h-full flex flex-col">
      <div className="flex h-full flex-col">
        {/* Logo/Header */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">ClientBill Pro</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const parentActive = isParentActive(item.path);
            return (
              <div key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    parentActive && !item.subItems
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      parentActive && !item.subItems ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </button>
                
                {/* Sub Items */}
                {item.subItems && parentActive && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const subActive = isActive(subItem.path);
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => navigate(subItem.path)}
                          className={cn(
                            'group flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors',
                            subActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          {subItem.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Welcome, {user?.username}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
