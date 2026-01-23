import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  actionItemsService,
  type Status,
  type CreateActionItemData,
  type UpdateActionItemData,
  type GroupedActionItems,
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

interface MoveItemParams {
  id: string;
  fromStatus: Status;
  toStatus: Status;
  newPosition: number;
}

export function useMoveActionItem() {
  const queryClient = useQueryClient();
  const queryKey = [...ACTION_ITEMS_QUERY_KEY, 'grouped'];

  return useMutation({
    mutationFn: async ({ id, toStatus, newPosition }: MoveItemParams) => {
      return actionItemsService.moveItem(id, toStatus, newPosition);
    },
    onMutate: async ({ id, fromStatus, toStatus, newPosition }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<GroupedActionItems>(queryKey);

      // Optimistically update to the new value
      if (previousItems) {
        const newItems = { ...previousItems };

        // Find and remove the item from its current column
        const item = newItems[fromStatus].find((i) => i.id === id);
        if (item) {
          newItems[fromStatus] = newItems[fromStatus].filter((i) => i.id !== id);

          // Add item to new column at the correct position
          const movedItem = { ...item, status: toStatus, position: newPosition };
          const targetColumn = [...newItems[toStatus]];
          targetColumn.splice(newPosition, 0, movedItem);

          // Update positions for all items in the target column
          newItems[toStatus] = targetColumn.map((i, index) => ({
            ...i,
            position: index,
          }));

          queryClient.setQueryData(queryKey, newItems);
        }
      }

      return { previousItems };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_QUERY_KEY });
    },
  });
}
