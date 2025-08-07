import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

export const useAdminStats = () => {
  return useQuery('admin-stats', adminService.getStats, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminUsers = (options: Parameters<typeof adminService.getUsers>[0] = {}) => {
  return useQuery(['admin-users', options], () => adminService.getUsers(options), {
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAdminUser = (userId: string) => {
  return useQuery(
    ['admin-user', userId],
    () => adminService.getUser(userId),
    {
      enabled: !!userId,
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useAdminSightings = (options: Parameters<typeof adminService.getSightings>[0] = {}) => {
  return useQuery(['admin-sightings', options], () => adminService.getSightings(options), {
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useVerifySighting = () => {
  const queryClient = useQueryClient();

  return useMutation(adminService.verifySighting, {
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-sightings']);
      queryClient.invalidateQueries(['sightings']);
      toast.success('Sighting verified successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to verify sighting';
      toast.error(message);
    },
  });
};

export const useHideSighting = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sightingId, reason }: { sightingId: string; reason?: string }) =>
      adminService.hideSighting(sightingId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-sightings']);
        queryClient.invalidateQueries(['sightings']);
        toast.success('Sighting hidden successfully');
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Failed to hide sighting';
        toast.error(message);
      },
    }
  );
};

export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.banUser(userId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        toast.success('User banned successfully');
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Failed to ban user';
        toast.error(message);
      },
    }
  );
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation(adminService.unbanUser, {
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User unbanned successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to unban user';
      toast.error(message);
    },
  });
};

export const useAdminActions = (options: Parameters<typeof adminService.getAdminActions>[0] = {}) => {
  return useQuery(['admin-actions', options], () => adminService.getAdminActions(options), {
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useReportedContent = () => {
  return useQuery('reported-content', adminService.getReportedContent, {
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useBulkAction = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ action, ids, reason }: { action: string; ids: string[]; reason?: string }) =>
      adminService.bulkAction(action, ids, reason),
    {
      onSuccess: (_, { action, ids }) => {
        queryClient.invalidateQueries(['admin-sightings']);
        queryClient.invalidateQueries(['admin-users']);
        queryClient.invalidateQueries(['sightings']);
        toast.success(`Bulk action "${action}" applied to ${ids.length} items`);
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Bulk action failed';
        toast.error(message);
      },
    }
  );
};