import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  HomeIcon,
  MapIcon,
  PlusIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Map', href: '/map', icon: MapIcon },
    { name: 'Submit', href: '/submit', icon: PlusIcon },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold gradient-text"
          >
            <span className="text-2xl">🛸</span>
            <span>UFO Beep</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'nav-link',
                  isActivePath(item.href) ? 'nav-link-active' : 'nav-link-inactive'
                )}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div
                className={clsx(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                )}
              />
              <span className="text-xs text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className={clsx(
                    'nav-link',
                    isActivePath('/profile') ? 'nav-link-active' : 'nav-link-inactive'
                  )}
                >
                  <UserIcon className="w-5 h-5 mr-2" />
                  {user?.username || 'Profile'}
                </Link>
                
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className={clsx(
                      'nav-link',
                      isActivePath('/admin') ? 'nav-link-active' : 'nav-link-inactive'
                    )}
                  >
                    <Cog6ToothIcon className="w-5 h-5 mr-2" />
                    Admin
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="nav-link nav-link-inactive"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className={clsx(
                    'nav-link',
                    isActivePath('/login') ? 'nav-link-active' : 'nav-link-inactive'
                  )}
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:bg-gray-700"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'nav-link w-full',
                    isActivePath(item.href) ? 'nav-link-active' : 'nav-link-inactive'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.name}
                </Link>
              ))}
              
              {/* Connection Status Mobile */}
              <div className="flex items-center px-3 py-2 space-x-2">
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  )}
                />
                <span className="text-sm text-gray-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="border-t border-gray-700 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'nav-link w-full',
                        isActivePath('/profile') ? 'nav-link-active' : 'nav-link-inactive'
                      )}
                    >
                      <UserIcon className="w-5 h-5 mr-2" />
                      {user?.username || 'Profile'}
                    </Link>
                    
                    {user?.isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={clsx(
                          'nav-link w-full',
                          isActivePath('/admin') ? 'nav-link-active' : 'nav-link-inactive'
                        )}
                      >
                        <Cog6ToothIcon className="w-5 h-5 mr-2" />
                        Admin
                      </Link>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="nav-link nav-link-inactive w-full text-left"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'nav-link w-full',
                        isActivePath('/login') ? 'nav-link-active' : 'nav-link-inactive'
                      )}
                    >
                      <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="btn btn-primary w-full mt-2"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;