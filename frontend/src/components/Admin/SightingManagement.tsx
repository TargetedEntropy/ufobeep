import React, { useState } from 'react';
import { useAdminSightings, useVerifySighting, useHideSighting, useBulkAction } from '../../hooks/useAdmin';
import { Sighting } from '../../types';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckBadgeIcon,
  EyeSlashIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const SightingManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'verified' | 'reported'>('all');
  const [page, setPage] = useState(1);
  const [selectedSightings, setSelectedSightings] = useState<Set<string>>(new Set());

  const { data: sightingsData, isLoading } = useAdminSightings({
    search: search || undefined,
    status,
    page,
    limit: 20,
  });

  const verifySighting = useVerifySighting();
  const hideSighting = useHideSighting();
  const bulkAction = useBulkAction();

  const sightings = sightingsData?.data || [];
  const pagination = sightingsData?.pagination;

  const handleSelectSighting = (sightingId: string, checked: boolean) => {
    const newSelection = new Set(selectedSightings);
    if (checked) {
      newSelection.add(sightingId);
    } else {
      newSelection.delete(sightingId);
    }
    setSelectedSightings(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSightings(new Set(sightings.map(s => s.id)));
    } else {
      setSelectedSightings(new Set());
    }
  };

  const handleVerifySighting = async (sighting: Sighting) => {
    if (!window.confirm(`Verify sighting "${sighting.title}"?`)) return;

    try {
      await verifySighting.mutateAsync(sighting.id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleHideSighting = async (sighting: Sighting) => {
    const reason = window.prompt(`Hide sighting "${sighting.title}"? Please provide a reason:`);
    if (reason === null) return;

    try {
      await hideSighting.mutateAsync({ 
        sightingId: sighting.id, 
        reason: reason.trim() || undefined 
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBulkVerify = async () => {
    if (selectedSightings.size === 0) return;
    if (!window.confirm(`Verify ${selectedSightings.size} selected sightings?`)) return;

    try {
      await bulkAction.mutateAsync({
        action: 'verify',
        ids: Array.from(selectedSightings),
      });
      setSelectedSightings(new Set());
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBulkHide = async () => {
    if (selectedSightings.size === 0) return;
    const reason = window.prompt(`Hide ${selectedSightings.size} selected sightings? Please provide a reason:`);
    if (reason === null) return;

    try {
      await bulkAction.mutateAsync({
        action: 'hide',
        ids: Array.from(selectedSightings),
        reason: reason.trim() || undefined,
      });
      setSelectedSightings(new Set());
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Sighting Management</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sightings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="input w-auto"
            >
              <option value="all">All Sightings</option>
              <option value="pending">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="reported">Reported</option>
            </select>
          </div>

          {selectedSightings.size > 0 && (
            <div className="mt-4 p-3 bg-cosmic-500/10 border border-cosmic-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-cosmic-300">
                  {selectedSightings.size} sighting{selectedSightings.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleBulkVerify}
                    disabled={bulkAction.isLoading}
                    className="btn btn-success btn-sm"
                  >
                    <CheckBadgeIcon className="w-4 h-4 mr-1" />
                    Verify Selected
                  </button>
                  <button 
                    onClick={handleBulkHide}
                    disabled={bulkAction.isLoading}
                    className="btn btn-danger btn-sm"
                  >
                    <EyeSlashIcon className="w-4 h-4 mr-1" />
                    Hide Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sightings Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading sightings...</p>
            </div>
          ) : sightings.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <EyeIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sightings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        checked={selectedSightings.size === sightings.length && sightings.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-600 bg-gray-700 text-cosmic-600"
                      />
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Sighting</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Location</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Submitted</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sightings.map((sighting) => (
                    <tr key={sighting.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedSightings.has(sighting.id)}
                          onChange={(e) => handleSelectSighting(sighting.id, e.target.checked)}
                          className="rounded border-gray-600 bg-gray-700 text-cosmic-600"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {sighting.mediaUrls && sighting.mediaUrls.length > 0 && (
                            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                              <PhotoIcon className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white max-w-xs truncate">
                              {sighting.title}
                            </div>
                            <div className="text-sm text-gray-400 max-w-xs truncate">
                              {sighting.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-sm text-gray-300">
                          <MapPinIcon className="w-3 h-3 mr-1" />
                          {sighting.location || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {sighting.latitude?.toFixed(4)}, {sighting.longitude?.toFixed(4)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-sm text-gray-300">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(sighting.createdAt!))} ago
                        </div>
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <UserIcon className="w-3 h-3 mr-1" />
                          {sighting.user?.username || 'Anonymous'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={clsx(
                              'badge text-xs',
                              sighting.isVerified ? 'badge-success' : 'badge-warning'
                            )}
                          >
                            {sighting.isVerified ? 'Verified' : 'Pending'}
                          </span>
                          {sighting.isHidden && (
                            <span className="badge badge-danger text-xs">Hidden</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {!sighting.isVerified && !sighting.isHidden && (
                            <button
                              onClick={() => handleVerifySighting(sighting)}
                              disabled={verifySighting.isLoading}
                              className="btn btn-success btn-sm"
                            >
                              <CheckBadgeIcon className="w-3 h-3 mr-1" />
                              Verify
                            </button>
                          )}
                          {!sighting.isHidden && (
                            <button
                              onClick={() => handleHideSighting(sighting)}
                              disabled={hideSighting.isLoading}
                              className="btn btn-danger btn-sm"
                            >
                              <EyeSlashIcon className="w-3 h-3 mr-1" />
                              Hide
                            </button>
                          )}
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
                {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} sightings
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

export default SightingManagement;