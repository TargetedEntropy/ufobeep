import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { NotificationBell } from './NotificationBell';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <NotificationBell />
    </div>
  );
};

export default Layout;