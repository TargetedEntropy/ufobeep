import React, { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export const NotificationBell: React.FC = () => {
  const { notifications, clearNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_nearby_sighting':
        return '🛸';
      case 'chat_activity':
        return '💬';
      case 'system_announcement':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_nearby_sighting':
        return 'border-l-alien-500';
      case 'chat_activity':
        return 'border-l-cosmic-500';
      case 'system_announcement':
        return 'border-l-yellow-500';
      default:
        return 'border-l-gray-500';
    }
  };

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Notification Bell */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-primary relative animate-bounce-slow"
        >
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Panel */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-80 max-h-96 overflow-y-auto card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearNotifications}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="card-body text-center text-gray-400">
                  <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={clsx(
                        'p-4 border-b border-gray-700 last:border-b-0 border-l-4',
                        getNotificationColor(notification.type)
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 text-xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(notification.timestamp))} ago
                          </p>
                          
                          {/* Additional notification data */}
                          {notification.data?.sightingId && (
                            <button
                              onClick={() => {
                                window.location.href = `/sighting/${notification.data.sightingId}`;
                              }}
                              className="text-xs text-cosmic-400 hover:text-cosmic-300 mt-1"
                            >
                              View sighting →
                            </button>
                          )}
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
    </div>
  );
};