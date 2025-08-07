import React from 'react';
import { useAdminStats } from '../../hooks/useAdmin';
import {
  UsersIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const AdminStats: React.FC = () => {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="card-body">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">Failed to load statistics</p>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: UsersIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Total Sightings',
      value: stats.totalSightings.toLocaleString(),
      icon: EyeIcon,
      color: 'text-cosmic-400',
      bgColor: 'bg-cosmic-400/10',
    },
    {
      label: 'Total Messages',
      value: stats.totalMessages.toLocaleString(),
      icon: ChatBubbleLeftIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Recent Sightings',
      value: stats.recentSightings.toLocaleString(),
      icon: ClockIcon,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      subtitle: 'Last 30 days',
    },
    {
      label: 'Verified Sightings',
      value: stats.verifiedSightings.toLocaleString(),
      icon: CheckBadgeIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      subtitle: `${((stats.verifiedSightings / stats.totalSightings) * 100).toFixed(1)}% verified`,
    },
    {
      label: 'Reported Sightings',
      value: stats.reportedSightings.toLocaleString(),
      icon: ExclamationTriangleIcon,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      subtitle: 'Need review',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statItems.map((item, index) => (
        <div key={index} className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-white">{item.value}</p>
                {item.subtitle && (
                  <p className="text-xs text-gray-400 mt-1">{item.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;