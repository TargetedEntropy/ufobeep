import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { useDeleteMessage, useHideMessage } from '../../hooks/useChat';
import {
  TrashIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId?: string;
  isAdmin?: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  currentUserId,
  isAdmin = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const deleteMessage = useDeleteMessage();
  const hideMessage = useHideMessage();

  const isOwner = message.user?.id === currentUserId;
  const isAnonymous = message.user?.isAnonymous !== false;
  const displayName = message.user?.username || 'Anonymous';

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteMessage.mutateAsync(message.id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleHide = async (reason?: string) => {
    try {
      await hideMessage.mutateAsync({ messageId: message.id, reason });
      setShowReportDialog(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getAvatarColors = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div
      className={clsx(
        'group flex items-start space-x-3 p-3 rounded-lg transition-colors',
        isOwner ? 'bg-cosmic-500/10' : 'hover:bg-gray-800/50'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={clsx(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
        getAvatarColors(displayName)
      )}>
        {isAnonymous ? (
          <UserIcon className="w-4 h-4" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className={clsx(
            'text-sm font-medium',
            isOwner ? 'text-cosmic-400' : 'text-white'
          )}>
            {displayName}
          </span>
          {isOwner && (
            <span className="text-xs text-cosmic-300 bg-cosmic-500/20 px-2 py-0.5 rounded">
              You
            </span>
          )}
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(message.createdAt))} ago
          </span>
        </div>

        <div className="text-sm text-gray-300 whitespace-pre-wrap break-words">
          {message.message}
        </div>
      </div>

      {/* Actions */}
      {showActions && (isOwner || isAdmin) && (
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleteMessage.isLoading}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete message"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
          
          {isAdmin && !isOwner && (
            <button
              onClick={() => setShowReportDialog(true)}
              className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
              title="Hide message"
            >
              <EyeSlashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md mx-4">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Hide Message</h3>
            </div>
            <div className="card-body">
              <p className="text-gray-300 mb-4">
                Are you sure you want to hide this message? It will be removed from the chat.
              </p>
              <div className="bg-gray-800 p-3 rounded border-l-4 border-yellow-500 mb-4">
                <p className="text-sm text-gray-300">"{message.message}"</p>
              </div>
            </div>
            <div className="card-footer">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowReportDialog(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleHide('Inappropriate content')}
                  disabled={hideMessage.isLoading}
                  className="btn btn-danger"
                >
                  {hideMessage.isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Hiding...
                    </div>
                  ) : (
                    <>
                      <EyeSlashIcon className="w-4 h-4 mr-2" />
                      Hide Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageItem;