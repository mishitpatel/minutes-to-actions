import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, FileText } from 'lucide-react';
import { useMeetingNotes } from '../hooks/useMeetingNotes';
import { NoteCard } from '../components/NoteCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';

export function MeetingNotesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    notes,
    pagination,
    isLoading,
    isError,
    refetch,
  } = useMeetingNotes(page, limit);

  const handleNewNote = () => {
    navigate('/notes/new');
  };

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => Math.min(pagination.total_pages, p + 1));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Meeting Notes</h2>
        <Button onClick={handleNewNote}>
          <Plus className="h-5 w-5" />
          New Note
        </Button>
      </div>

      {isLoading && (
        <div className="bg-card rounded-lg shadow p-8">
          <div className="flex items-center justify-center">
            <Spinner />
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-card rounded-lg shadow p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Failed to load notes
            </h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your meeting notes.
            </p>
            <Button onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && notes.length === 0 && (
        <div className="bg-card rounded-lg shadow">
          <EmptyState
            icon={<FileText className="h-16 w-16" strokeWidth={1.5} />}
            title="No meeting notes yet"
            description="Paste your meeting notes to extract action items automatically"
            action={{
              label: 'Create your first note',
              onClick: handleNewNote,
            }}
          />
        </div>
      )}

      {!isLoading && !isError && notes.length > 0 && (
        <>
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>

          {pagination.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={page === pagination.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
