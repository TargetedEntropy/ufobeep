import { useQuery, useMutation, useQueryClient } from 'react-query';
import { sightingService } from '../services/sightingService';
import { QueryOptions, Sighting } from '../types';
import toast from 'react-hot-toast';

export const useSightings = (options: QueryOptions = {}) => {
  return useQuery(
    ['sightings', options],
    () => sightingService.getSightings(options),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    }
  );
};

export const useSighting = (id: string) => {
  return useQuery(
    ['sighting', id],
    () => sightingService.getSighting(id),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

export const useCreateSighting = () => {
  const queryClient = useQueryClient();

  return useMutation(sightingService.createSighting, {
    onSuccess: (newSighting) => {
      queryClient.invalidateQueries(['sightings']);
      toast.success('Sighting submitted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to submit sighting';
      toast.error(message);
    },
  });
};

export const useUpdateSighting = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, data }: { id: string; data: Partial<Sighting> }) =>
      sightingService.updateSighting(id, data),
    {
      onSuccess: (updatedSighting, { id }) => {
        queryClient.setQueryData(['sighting', id], updatedSighting);
        queryClient.invalidateQueries(['sightings']);
        toast.success('Sighting updated successfully!');
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Failed to update sighting';
        toast.error(message);
      },
    }
  );
};

export const useDeleteSighting = () => {
  const queryClient = useQueryClient();

  return useMutation(sightingService.deleteSighting, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sightings']);
      toast.success('Sighting deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to delete sighting';
      toast.error(message);
    },
  });
};

export const useReportSighting = () => {
  return useMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      sightingService.reportSighting(id, reason),
    {
      onSuccess: () => {
        toast.success('Report submitted successfully. Thank you for helping keep the community safe.');
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Failed to submit report';
        toast.error(message);
      },
    }
  );
};