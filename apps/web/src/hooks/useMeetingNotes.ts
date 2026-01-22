import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  meetingNotesService,
  type CreateNoteData,
  type UpdateNoteData,
} from '../services/meeting-notes.service';

export const MEETING_NOTES_QUERY_KEY = ['meeting-notes'];

export function useMeetingNotes(page = 1, limit = 10) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...MEETING_NOTES_QUERY_KEY, 'list', page, limit],
    queryFn: () => meetingNotesService.list(page, limit),
    staleTime: 1000 * 60, // 1 minute
  });

  const createMutation = useMutation({
    mutationFn: (noteData: CreateNoteData) => meetingNotesService.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETING_NOTES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteData }) =>
      meetingNotesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETING_NOTES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => meetingNotesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETING_NOTES_QUERY_KEY });
    },
  });

  return {
    notes: data?.data ?? [],
    pagination: data?.pagination ?? { page: 1, limit: 10, total: 0, total_pages: 0 },
    isLoading,
    isError,
    error,
    refetch,
    createNote: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateNote: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteNote: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export function useMeetingNote(id: string) {
  return useQuery({
    queryKey: [...MEETING_NOTES_QUERY_KEY, 'detail', id],
    queryFn: () => meetingNotesService.get(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}
