import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  actionItemsService,
  type Status,
  type CreateActionItemData,
  type UpdateActionItemData,
} from '../services/action-items.service';

export const ACTION_ITEMS_QUERY_KEY = ['action-items'];

export function useActionItems() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...ACTION_ITEMS_QUERY_KEY, 'grouped'],
    queryFn: () => actionItemsService.listGrouped(),
    staleTime: 1000 * 60, // 1 minute
  });

  const createMutation = useMutation({
    mutationFn: (itemData: CreateActionItemData) => actionItemsService.create(itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActionItemData }) =>
      actionItemsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => actionItemsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_QUERY_KEY });
    },
  });

  return {
    items: data ?? { todo: [], doing: [], done: [] },
    isLoading,
    isError,
    error,
    refetch,
    createItem: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateItem: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteItem: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export function useUpdateActionItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      actionItemsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_QUERY_KEY });
    },
  });
}

export function useActionItem(id: string) {
  return useQuery({
    queryKey: [...ACTION_ITEMS_QUERY_KEY, 'detail', id],
    queryFn: () => actionItemsService.get(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}
