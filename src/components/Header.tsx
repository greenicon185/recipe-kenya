import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import { 
  User, 
  Heart, 
  LogOut, 
  ChefHat, 
  Settings, 
  Menu, 
  X,
  Home,
  Utensils,
  Calendar,
  ShoppingCart,
  BookOpen,
  Users
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setSidebarOpen(false);
  };

  const navigationItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/cuisines', label: 'Cuisines', icon: Utensils },
    { to: '/communities', label: 'Communities', icon: Users },
    { to: '/meal-planner', label: 'Meal Planner', icon: Calendar },
    { to: '/supermarkets', label: 'Supermarkets', icon: ShoppingCart },
  ];

  const userItems = user ? [
    { to: '/favorites', label: 'Favorites', icon: Heart },
    { to: '/settings', label: 'Settings', icon: Settings },
  ] : [];

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
            <ChefHat className="h-8 w-8" />
            <span className="text-xl font-bold">Recipe Haven</span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Desktop Navigation - Simplified */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/cuisines" 
              className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 font-medium transition-colors"
            >
              Cuisines
            </Link>
            <Link 
              to="/communities" 
              className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 font-medium transition-colors flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Communities
            </Link>
            <Link 
              to="/meal-planner" 
              className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 font-medium transition-colors flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              Meal Planner
            </Link>
            {user && (
              <Link 
                to="/favorites" 
                className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 font-medium transition-colors flex items-center gap-1"
              >
                <Heart className="h-4 w-4" />
                Favorites
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden xl:block">
                  Welcome, {profile?.username || user.email}
                </span>
                <Link to="/settings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 hidden md:flex"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 hidden md:flex"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="flex items-center gap-2 hidden md:flex">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Hamburger Menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ChefHat className="h-6 w-6 text-orange-600" />
                    Recipe Haven
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Search Bar */}
                  <div className="px-2">
                    <SearchBar />
                  </div>

                  <Separator />

                  {/* Main Navigation */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider px-2">
                      Navigation
                    </h3>
                    <nav className="space-y-1">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={handleNavClick}
                            className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                          >
                            <Icon className="h-5 w-5" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  {/* User Section */}
                  {user && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider px-2">
                          My Account
                        </h3>
                        <nav className="space-y-1">
                          {userItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                onClick={handleNavClick}
                                className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                              >
                                <Icon className="h-5 w-5" />
                                {item.label}
                              </Link>
                            );
                          })}
                        </nav>
                      </div>
                    </>
                  )}

                  {/* User Info & Actions */}
                  {user ? (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="px-3 py-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {profile?.username || user.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Signed in
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSignOut}
                            className="w-full justify-start"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="px-3 py-2">
                          <p className="text-sm text-gray-500">
                            Not signed in
                          </p>
                        </div>
                        <Link to="/auth" onClick={handleNavClick}>
                          <Button className="w-full justify-start">
                            <User className="h-4 w-4 mr-2" />
                            Sign In
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar - Only show when sidebar is closed */}
        {!sidebarOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-3">
            <SearchBar className="w-full" />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
