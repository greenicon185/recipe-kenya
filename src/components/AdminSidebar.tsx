
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ChefHat, 
  Users, 
  BarChart3, 
  Settings, 
  MessageSquare,
  Plus,
  LogOut,
  Home
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin',
      exact: true
    },
    {
      label: 'Recipes',
      icon: ChefHat,
      children: [
        { label: 'All Recipes', href: '/admin' },
        { label: 'Create Recipe', href: '/admin/recipes/create' }
      ]
    },
    {
      label: 'User Management',
      icon: Users,
      href: '/admin/users'
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      href: '/admin/analytics'
    },
    {
      label: 'Support Tickets',
      icon: MessageSquare,
      href: '/admin/support'
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/admin/settings'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_login_time');
    window.location.href = '/admin/login';
  };

  const isActiveLink = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-gray-800">
        <h1 className="text-xl font-bold text-orange-500">Recipe Admin</h1>
        <p className="text-sm text-gray-400 mt-1">Management Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <div className="space-y-1">
                <div className="flex items-center px-3 py-2 text-gray-300 font-medium">
                  <item.icon className="w-5 h-5 mr-3 text-orange-400" />
                  <span>{item.label}</span>
                </div>
                <div className="ml-8 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm transition-all duration-200 hover:translate-x-1',
                        isActiveLink(child.href)
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-3 rounded-md text-sm font-medium transition-all duration-200 hover:translate-x-1',
                  isActiveLink(item.href, item.exact)
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 mr-3 text-orange-400" />
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 space-y-2 bg-gray-800">
        <Link
          to="/"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 hover:translate-x-1"
        >
          <Home className="w-5 h-5 mr-3 text-orange-400" />
          View Site
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 hover:translate-x-1"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
