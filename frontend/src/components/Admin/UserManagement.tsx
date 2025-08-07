import React, { useState } from 'react';
import { useAdminUsers, useBanUser, useUnbanUser } from '../../hooks/useAdmin';
import { User } from '../../types';
import {
  MagnifyingGlassIcon,
  UserIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const UserManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState<'all' | 'registered' | 'anonymous'>('all');
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const { data: usersData, isLoading } = useAdminUsers({
    search: search || undefined,
    type: userType,
    page,
    limit: 20,
  });

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelection = new Set(selectedUsers);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBanUser = async (user: User) => {
    const reason = window.prompt(`Ban user ${user.username || user.id}? Please provide a reason:`);
    if (reason === null) return;

    try {
      await banUser.mutateAsync({ userId: user.id, reason: reason.trim() || undefined });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUnbanUser = async (user: User) => {
    if (!window.confirm(`Unban user ${user.username || user.id}?`)) return;

    try {
      await unbanUser.mutateAsync(user.id);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as any)}
              className="input w-auto"
            >
              <option value="all">All Users</option>
              <option value="registered">Registered</option>
              <option value="anonymous">Anonymous</option>
            </select>
          </div>

          {selectedUsers.size > 0 && (
            <div className="mt-4 p-3 bg-cosmic-500/10 border border-cosmic-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-cosmic-300">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button className="btn btn-danger btn-sm">
                    <NoSymbolIcon className="w-4 h-4 mr-1" />
                    Ban Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-600 bg-gray-700 text-cosmic-600"
                      />
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">User</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Activity</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Joined</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                          className="rounded border-gray-600 bg-gray-700 text-cosmic-600"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-300" />
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {user.username || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={clsx(
                            'badge text-xs',
                            user.isAnonymous ? 'badge-warning' : 'badge-success'
                          )}
                        >
                          {user.isAnonymous ? 'Anonymous' : 'Registered'}
                        </span>
                        {user.isAdmin && (
                          <span className="badge badge-primary text-xs ml-1">Admin</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-300">
                          <div className="flex items-center">
                            <EyeIcon className="w-3 h-3 mr-1" />
                            {user._count?.sightings || 0} sightings
                          </div>
                          <div className="flex items-center mt-1">
                            <ChatBubbleLeftIcon className="w-3 h-3 mr-1" />
                            {user._count?.chatMessages || 0} messages
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-300">
                          {formatDistanceToNow(new Date(user.createdAt!))} ago
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.sessionCount} session{user.sessionCount !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="badge badge-success text-xs">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleBanUser(user)}
                            disabled={banUser.isLoading}
                            className="btn btn-danger btn-sm"
                          >
                            <NoSymbolIcon className="w-3 h-3 mr-1" />
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(page - 1) * pagination.limit + 1} to{' '}
                {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} users
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

export default UserManagement;