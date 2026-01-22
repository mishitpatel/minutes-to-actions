import { useNavigate } from 'react-router-dom';
import { useMeetingNotes } from '../hooks/useMeetingNotes';
import { NoteEditor, type NoteEditorData } from '../components/NoteEditor';

export function NewNotePage() {
  const navigate = useNavigate();
  const { createNote, isCreating } = useMeetingNotes();

  const handleSave = (data: NoteEditorData) => {
    createNote(
      {
        title: data.title || undefined,
        body: data.body,
      },
      {
        onSuccess: (note) => {
          navigate(`/notes/${note.id}`);
        },
      }
    );
  };

  const handleCancel = () => {
    navigate('/notes');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
              aria-label="Back to notes"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Create New Note
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <NoteEditor
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isCreating}
            mode="create"
          />
        </div>
      </main>
    </div>
  );
}
