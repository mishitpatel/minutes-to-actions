import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingNote, useMeetingNotes } from '../hooks/useMeetingNotes';
import { NoteEditor, type NoteEditorData } from '../components/NoteEditor';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ExtractionReviewPanel } from '../components/ExtractionReviewPanel';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: note, isLoading, isError, error } = useMeetingNote(id!);
  const { updateNote, isUpdating, deleteNote, isDeleting } = useMeetingNotes();

  const handleBack = () => {
    navigate('/notes');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = (data: NoteEditorData) => {
    updateNote(
      {
        id: id!,
        data: {
          title: data.title || undefined,
          body: data.body,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteNote(id!, {
      onSuccess: () => {
        navigate('/notes');
      },
    });
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
            aria-label="Back to notes"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (includes 404)
  if (isError) {
    const is404 = (error as { status?: number })?.status === 404;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
            aria-label="Back to notes"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {is404 ? 'Note Not Found' : 'Error'}
          </h1>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d={is404
                  ? "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                }
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {is404 ? 'Note not found' : 'Failed to load note'}
            </h2>
            <p className="text-gray-500 mb-6">
              {is404
                ? "This note doesn't exist or may have been deleted."
                : 'There was an error loading this note. Please try again.'}
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Notes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleCancelEdit}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
            aria-label="Cancel editing"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Edit Note</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <NoteEditor
            initialData={{
              title: note.title || '',
              body: note.body,
            }}
            onSave={handleSave}
            onCancel={handleCancelEdit}
            isSaving={isUpdating}
            mode="edit"
          />
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
            aria-label="Back to notes"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Note Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {note.title || 'Untitled Note'}
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span>Created {formatDate(note.created_at)}</span>
            {note.updated_at !== note.created_at && (
              <>
                <span className="text-gray-300">|</span>
                <span>Updated {formatDate(note.updated_at)}</span>
              </>
            )}
          </div>
          <div className="prose prose-gray max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
              {note.body}
            </pre>
          </div>
        </div>

        <ExtractionReviewPanel noteId={id!} />
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
