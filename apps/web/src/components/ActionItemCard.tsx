import { Link } from 'react-router-dom';
import { Check, AlertTriangle, MoreVertical } from 'lucide-react';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { ActionItemWithSource, Status } from '../services/action-items.service';

interface ActionItemCardProps {
  item: ActionItemWithSource;
  onStatusChange?: (id: string, status: Status) => void;
  onClick?: (item: ActionItemWithSource) => void;
}

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-transparent',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent',
} as const;

const STATUS_LABELS: Record<Status, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(dateString: string, status: Status): boolean {
  if (status === 'done') return false;
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export function ActionItemCard({ item, onStatusChange, onClick }: ActionItemCardProps) {
  const isDone = item.status === 'done';
  const overdue = item.due_date && isOverdue(item.due_date, item.status);

  const handleCardClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  const handleMarkDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange && item.status !== 'done') {
      onStatusChange(item.id, 'done');
    }
  };

  const handleStatusSelect = (newStatus: Status) => {
    if (onStatusChange && newStatus !== item.status) {
      onStatusChange(item.id, newStatus);
    }
  };

  const handleSourceLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
      className={`bg-card rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow cursor-pointer ${
        overdue ? 'border-destructive/50 bg-destructive/5' : 'border-border'
      }`}
      data-testid="action-item-card"
    >
      {/* Header: Title and Mark Done */}
      <div className="flex items-start gap-2 mb-2">
        {/* Mark done checkbox */}
        <button
          onClick={handleMarkDone}
          disabled={isDone}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isDone
              ? 'bg-success border-success text-success-foreground cursor-default'
              : 'border-border hover:border-success text-transparent hover:text-success/30'
          }`}
          title={isDone ? 'Completed' : 'Mark as done'}
        >
          <Check className="h-3 w-3" />
        </button>

        {/* Title */}
        <h4
          className={`flex-1 text-sm font-medium line-clamp-2 ${
            isDone ? 'text-muted-foreground line-through' : 'text-foreground'
          }`}
        >
          {item.title}
        </h4>
      </div>

      {/* Priority badge and due date row */}
      <div className="flex items-center justify-between mb-2">
        <Badge className={PRIORITY_STYLES[item.priority]}>
          {item.priority}
        </Badge>

        {item.due_date && (
          <span
            className={`text-xs flex items-center gap-1 ${
              overdue ? 'text-destructive font-medium' : 'text-muted-foreground'
            }`}
          >
            {overdue && <AlertTriangle className="h-3 w-3" />}
            {formatDate(item.due_date)}
          </span>
        )}
      </div>

      {/* Footer: Source note link and Move to dropdown */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {/* Source note link */}
        <div className="flex-1 min-w-0">
          {item.meeting_note ? (
            <Link
              to={`/notes/${item.meeting_note.id}`}
              onClick={handleSourceLinkClick}
              className="text-xs text-primary hover:text-primary/80 hover:underline truncate block"
              title={item.meeting_note.title || 'View source note'}
            >
              {item.meeting_note.title || 'Untitled Note'}
            </Link>
          ) : item.meeting_note_id ? (
            <span className="text-xs text-muted-foreground italic">Note deleted</span>
          ) : null}
        </div>

        {/* Move to dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
              title="Move to..."
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuLabel className="text-xs">Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(['todo', 'doing', 'done'] as Status[]).map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusSelect(status)}
                disabled={status === item.status}
              >
                {STATUS_LABELS[status]}
                {status === item.status && (
                  <span className="ml-2 text-xs text-muted-foreground">(current)</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
