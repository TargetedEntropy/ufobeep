import React, { useState } from 'react';
import { useReportedContent, useHideSighting, useBanUser } from '../../hooks/useAdmin';
import { Sighting } from '../../types';
import {
  ExclamationTriangleIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  EyeSlashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const ReportedContent: React.FC = () => {
  const { data: reportedData, isLoading, error } = useReportedContent();
  const hideSighting = useHideSighting();
  const banUser = useBanUser();

  const [activeTab, setActiveTab] = useState<'sightings' | 'messages'>('sightings');

  const handleHideSighting = async (sighting: Sighting) => {
    const reason = window.prompt(`Hide reported sighting "${sighting.title}"? Please provide a reason:`);
    if (reason === null) return;

    try {
      await hideSighting.mutateAsync({ 
        sightingId: sighting.id, 
        reason: reason.trim() || 'Reported content' 
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBanUser = async (userId: string, username?: string) => {
    const reason = window.prompt(`Ban user ${username || userId} for reported content? Please provide a reason:`);
    if (reason === null) return;

    try {
      await banUser.mutateAsync({ userId, reason: reason.trim() || 'Reported content' });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDismissReport = (type: 'sighting' | 'message', id: string) => {
    // This would typically call an API to mark the report as resolved without taking action
    console.log(`Dismissing ${type} report for ID: ${id}`);
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading reported content...</p>
        </div>
      </div>
    );
  }

  if (error || !reportedData) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">Failed to load reported content</p>
        </div>
      </div>
    );
  }

  const reportedSightings = reportedData.sightings || [];
  const reportedMessages = reportedData.messages || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-red-400" />
            Reported Content
          </h2>
        </div>
        <div className="card-body">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('sightings')}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'sightings'
                  ? 'bg-cosmic-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              )}
            >
              <EyeIcon className="w-4 h-4 inline mr-2" />
              Sightings ({reportedSightings.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'messages'
                  ? 'bg-cosmic-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              )}
            >
              <ChatBubbleLeftIcon className="w-4 h-4 inline mr-2" />
              Messages ({reportedMessages.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'sightings' && (
        <div className="card">
          <div className="card-body p-0">
            {reportedSightings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reported sightings</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {reportedSightings.map((sighting) => (
                  <div key={sighting.id} className="p-6 hover:bg-gray-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{sighting.title}</h3>
                            <div className="flex items-center text-sm text-gray-400 space-x-4">
                              <span className="flex items-center">
                                <UserIcon className="w-3 h-3 mr-1" />
                                {sighting.user?.username || 'Anonymous'}
                              </span>
                              <span className="flex items-center">
                                <MapPinIcon className="w-3 h-3 mr-1" />
                                {sighting.location || 'Unknown location'}
                              </span>
                              <span className="flex items-center">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(sighting.createdAt!))} ago
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-4 line-clamp-3">
                          {sighting.description}
                        </p>

                        <div className="flex items-center space-x-2">
                          {sighting.isVerified && (
                            <span className="badge badge-success text-xs">Verified</span>
                          )}
                          {sighting.isHidden && (
                            <span className="badge badge-danger text-xs">Hidden</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
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
                        {sighting.user && !sighting.user.isAnonymous && (
                          <button
                            onClick={() => handleBanUser(sighting.user!.id, sighting.user!.username)}
                            disabled={banUser.isLoading}
                            className="btn btn-danger btn-sm"
                          >
                            <NoSymbolIcon className="w-3 h-3 mr-1" />
                            Ban User
                          </button>
                        )}
                        <button
                          onClick={() => handleDismissReport('sighting', sighting.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="card">
          <div className="card-body p-0">
            {reportedMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reported messages</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {reportedMessages.map((message: any) => (
                  <div key={message.id} className="p-6 hover:bg-gray-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <ChatBubbleLeftIcon className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              Chat Message Report
                            </h3>
                            <div className="flex items-center text-sm text-gray-400 space-x-4">
                              <span className="flex items-center">
                                <UserIcon className="w-3 h-3 mr-1" />
                                {message.user?.username || message.anonymousName || 'Anonymous'}
                              </span>
                              <span className="flex items-center">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(message.createdAt))} ago
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800 p-3 rounded-lg mb-4">
                          <p className="text-gray-300">{message.content}</p>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        {message.user && !message.user.isAnonymous && (
                          <button
                            onClick={() => handleBanUser(message.user.id, message.user.username)}
                            disabled={banUser.isLoading}
                            className="btn btn-danger btn-sm"
                          >
                            <NoSymbolIcon className="w-3 h-3 mr-1" />
                            Ban User
                          </button>
                        )}
                        <button
                          onClick={() => handleDismissReport('message', message.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportedContent;