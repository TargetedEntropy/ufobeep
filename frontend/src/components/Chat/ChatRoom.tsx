import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSightingMessages, useCreateMessage } from '../../hooks/useChat';
import { ChatMessage, SocketChatMessage } from '../../types';
import ChatMessageItem from './ChatMessageItem';
import TypingIndicator from './TypingIndicator';
import {
  PaperAirplaneIcon,
  UserIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoomProps {
  sightingId: string;
  sightingTitle?: string;
  className?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  sightingId,
  sightingTitle,
  className = '',
}) => {
  const { user, isAuthenticated } = useAuth();
  const {
    socket,
    isConnected,
    joinSighting,
    leaveSighting,
    sendChatMessage,
    startTyping,
    stopTyping,
  } = useSocket();

  const { data: messagesData, refetch } = useSightingMessages(sightingId);
  const createMessage = useCreateMessage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize messages from API
  useEffect(() => {
    if (messagesData?.data) {
      setMessages(messagesData.data);
    }
  }, [messagesData]);

  // Join sighting room on mount
  useEffect(() => {
    if (isConnected && sightingId) {
      joinSighting(sightingId);
    }

    return () => {
      if (sightingId) {
        leaveSighting(sightingId);
      }
    };
  }, [isConnected, sightingId, joinSighting, leaveSighting]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: SocketChatMessage) => {
      if (message.sightingId === sightingId) {
        setMessages(prev => [...prev, message as ChatMessage]);
        scrollToBottom();
      }
    };

    const handleChatHistory = (data: { sightingId: string; messages: SocketChatMessage[] }) => {
      if (data.sightingId === sightingId) {
        setMessages(data.messages as ChatMessage[]);
        scrollToBottom();
      }
    };

    const handleUserJoined = (data: { userId: string; username: string }) => {
      setOnlineUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
    };

    const handleUserLeft = (data: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    };

    const handleUserTyping = (data: { userId: string; username: string }) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.username || 'Someone']);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
    };

    socket.on('new_chat_message', handleNewMessage);
    socket.on('chat_history', handleChatHistory);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('new_chat_message', handleNewMessage);
      socket.off('chat_history', handleChatHistory);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, sightingId, user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) return;

    const nameToUse = !isAuthenticated && anonymousName.trim() 
      ? anonymousName.trim() 
      : undefined;

    // Send via WebSocket for real-time
    if (isConnected) {
      sendChatMessage(sightingId, trimmedMessage, nameToUse);
    } else {
      // Fallback to REST API
      try {
        await createMessage.mutateAsync({
          sightingId,
          message: trimmedMessage,
          anonymousName: nameToUse,
        });
      } catch (error) {
        // Error handled in hook
      }
    }

    setMessageText('');
    handleStopTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartTyping = () => {
    if (!isTyping && isConnected) {
      setIsTyping(true);
      startTyping(sightingId);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    if (isTyping && isConnected) {
      setIsTyping(false);
      stopTyping(sightingId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Discussion</h3>
            {sightingTitle && (
              <p className="text-sm text-gray-400 mt-1 truncate">{sightingTitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <InformationCircleIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet. Be the first to start the discussion!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                currentUserId={user?.id}
                isAdmin={user?.isAdmin}
              />
            ))}
            <TypingIndicator users={typingUsers} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="card-footer">
        {!isAuthenticated && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={anonymousName}
              onChange={(e) => setAnonymousName(e.target.value)}
              className="input text-sm"
              maxLength={50}
            />
          </div>
        )}

        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleStartTyping();
              }}
              onKeyDown={handleKeyPress}
              onBlur={handleStopTyping}
              placeholder="Type your message..."
              className="textarea resize-none"
              rows={2}
              maxLength={1000}
              disabled={!isConnected && createMessage.isLoading}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {messageText.length}/1000
              </span>
              {!isAuthenticated && (
                <span className="text-xs text-gray-400">
                  Posting anonymously
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || (!isConnected && createMessage.isLoading)}
            className="btn btn-primary"
          >
            {createMessage.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <PaperAirplaneIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <div>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
          <div>
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;