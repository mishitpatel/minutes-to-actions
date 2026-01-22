import { useNavigate } from 'react-router-dom';
import type { MeetingNote } from '../services/meeting-notes.service';

interface NoteCardProps {
  note: MeetingNote;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function NoteCard({ note }: NoteCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/notes/${note.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {note.title || 'Untitled Note'}
      </h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {truncateText(note.body, 150)}
      </p>
      <p className="text-xs text-gray-400">
        {formatDate(note.created_at)}
      </p>
    </button>
  );
}
