import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Pencil, Trash2, Frown, AlertTriangle } from 'lucide-react';
import { useMeetingNote, useMeetingNotes } from '../hooks/useMeetingNotes';
import { NoteEditor, type NoteEditorData } from '../components/NoteEditor';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ExtractionReviewPanel } from '../components/ExtractionReviewPanel';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back to notes"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="bg-card rounded-lg shadow p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (includes 404)
  if (isError) {
    const is404 = (error as { status?: number })?.status === 404;
    const Icon = is404 ? Frown : AlertTriangle;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back to notes"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            {is404 ? 'Note Not Found' : 'Error'}
          </h1>
        </div>
        <div className="bg-card rounded-lg shadow p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Icon className="h-16 w-16 text-muted-foreground mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {is404 ? 'Note not found' : 'Failed to load note'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {is404
                ? "This note doesn't exist or may have been deleted."
                : 'There was an error loading this note. Please try again.'}
            </p>
            <Button onClick={handleBack}>
              Back to Notes
            </Button>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelEdit}
            aria-label="Cancel editing"
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Edit Note</h1>
        </div>
        <div className="bg-card rounded-lg shadow p-6">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back to notes"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Note Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {note.title || 'Untitled Note'}
          </h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>Created {formatDate(note.created_at)}</span>
            {note.updated_at !== note.created_at && (
              <>
                <span className="text-border">|</span>
                <span>Updated {formatDate(note.updated_at)}</span>
              </>
            )}
          </div>
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans text-muted-foreground bg-muted p-4 rounded-lg">
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
