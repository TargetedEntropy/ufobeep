import { useQuery, useMutation, useQueryClient } from 'react-query';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';

export const useSightingMessages = (sightingId: string) => {
  return useQuery(
    ['chat', sightingId],
    () => chatService.getSightingMessages(sightingId),
    {
      enabled: !!sightingId,
      staleTime: 0, // Always fetch fresh data for real-time chat
      refetchInterval: 10000, // Refetch every 10 seconds as fallback
    }
  );
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sightingId, message, anonymousName }: {
      sightingId: string;
      message: string;
      anonymousName?: string;
    }) => chatService.createMessage(sightingId, message, anonymousName),
    {
      onSuccess: (newMessage, { sightingId }) => {
        // Update the messages cache
        queryClient.setQueryData(['chat', sightingId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: [...old.data, newMessage],
          };
        });
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Failed to send message';
        toast.error(message);
      },
    }
  );
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation(chatService.deleteMessage, {
    onSuccess: () => {
      queryClient.invalidateQueries(['chat']);
      toast.success('Message deleted');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to delete message';
      toast.error(message);
    },
  });
};

export const useHideMessage = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ messageId, reason }: { messageId: string; reason?: string }) =>
      chatService.hideMessage(messageId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat']);
        toast.success('Message hidden');
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Failed to hide message';
        toast.error(message);
      },
    }
  );
};