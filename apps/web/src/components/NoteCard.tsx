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
      className="w-full text-left rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow p-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <h3 className="text-lg font-medium text-card-foreground mb-2">
        {note.title || 'Untitled Note'}
      </h3>
      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
        {truncateText(note.body, 150)}
      </p>
      <p className="text-xs text-muted-foreground/60">
        {formatDate(note.created_at)}
      </p>
    </button>
  );
}
