import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminStats from '../components/Admin/AdminStats';
import UserManagement from '../components/Admin/UserManagement';
import SightingManagement from '../components/Admin/SightingManagement';
import ReportedContent from '../components/Admin/ReportedContent';
import AdminActions from '../components/Admin/AdminActions';
import {
  ChartBarIcon,
  UsersIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

type AdminTab = 'stats' | 'users' | 'sightings' | 'reports' | 'actions';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');

  if (!user?.isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold mb-2 text-red-400">Access Denied</h2>
            <p className="text-gray-400">You don't have permission to access this page</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'stats' as AdminTab,
      label: 'Dashboard',
      icon: ChartBarIcon,
      component: AdminStats,
    },
    {
      id: 'users' as AdminTab,
      label: 'Users',
      icon: UsersIcon,
      component: UserManagement,
    },
    {
      id: 'sightings' as AdminTab,
      label: 'Sightings',
      icon: EyeIcon,
      component: SightingManagement,
    },
    {
      id: 'reports' as AdminTab,
      label: 'Reports',
      icon: ExclamationTriangleIcon,
      component: ReportedContent,
    },
    {
      id: 'actions' as AdminTab,
      label: 'Actions',
      icon: ClipboardDocumentListIcon,
      component: AdminActions,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AdminStats;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage users, sightings, and platform settings</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="card">
          <div className="card-body p-4">
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-cosmic-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    )}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <ActiveComponent />
    </div>
  );
};

export default AdminPage;