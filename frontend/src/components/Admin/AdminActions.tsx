import React, { useState } from 'react';
import { useAdminActions } from '../../hooks/useAdmin';
import {
  ClipboardDocumentListIcon,
  UserIcon,
  EyeIcon,
  NoSymbolIcon,
  CheckBadgeIcon,
  EyeSlashIcon,
  CalendarIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const AdminActions: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data: actionsData, isLoading } = useAdminActions({
    page,
    limit: 50,
  });

  const actions = actionsData?.data || [];
  const pagination = actionsData?.pagination;

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'ban_user':
      case 'unban_user':
        return NoSymbolIcon;
      case 'verify_sighting':
        return CheckBadgeIcon;
      case 'hide_sighting':
        return EyeSlashIcon;
      case 'delete_message':
        return EyeSlashIcon;
      default:
        return ComputerDesktopIcon;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'ban_user':
        return 'text-red-400 bg-red-400/10';
      case 'unban_user':
        return 'text-green-400 bg-green-400/10';
      case 'verify_sighting':
        return 'text-green-400 bg-green-400/10';
      case 'hide_sighting':
      case 'delete_message':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      ban_user: 'User Banned',
      unban_user: 'User Unbanned',
      verify_sighting: 'Sighting Verified',
      hide_sighting: 'Sighting Hidden',
      delete_message: 'Message Deleted',
      bulk_action: 'Bulk Action',
    };
    return labels[actionType] || actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold flex items-center">
            <ClipboardDocumentListIcon className="w-6 h-6 mr-2 text-cosmic-400" />
            Admin Actions Log
          </h2>
        </div>
        <div className="card-body">
          <p className="text-gray-400">
            Track all administrative actions performed by admin users on the platform.
          </p>
        </div>
      </div>

      {/* Actions List */}
      <div className="card">
        <div className="card-body p-0">
          {actions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No admin actions recorded</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {actions.map((action: any) => {
                const IconComponent = getActionIcon(action.actionType);
                const colorClasses = getActionColor(action.actionType);
                
                return (
                  <div key={action.id} className="p-6 hover:bg-gray-800/50">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${colorClasses}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">
                            {getActionLabel(action.actionType)}
                          </h3>
                          <div className="flex items-center text-sm text-gray-400">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {formatDistanceToNow(new Date(action.createdAt))} ago
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-400 mb-3 space-x-4">
                          <span className="flex items-center">
                            <UserIcon className="w-3 h-3 mr-1" />
                            Admin: {action.adminUser?.username || 'System'}
                          </span>
                          {action.targetUser && (
                            <span className="flex items-center">
                              Target: {action.targetUser.username || 'Anonymous'}
                            </span>
                          )}
                          {action.targetSighting && (
                            <span className="flex items-center">
                              <EyeIcon className="w-3 h-3 mr-1" />
                              Sighting: {action.targetSighting.title}
                            </span>
                          )}
                        </div>

                        {action.details && (
                          <div className="bg-gray-800 p-3 rounded-lg mb-3">
                            <p className="text-gray-300 text-sm">
                              <strong>Details:</strong> {action.details}
                            </p>
                          </div>
                        )}

                        {action.reason && (
                          <div className="bg-gray-800 p-3 rounded-lg">
                            <p className="text-gray-300 text-sm">
                              <strong>Reason:</strong> {action.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(page - 1) * pagination.limit + 1} to{' '}
                {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} actions
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActions;