import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ActionItemWithSource, Status } from '../services/action-items.service';

interface ActionItemCardProps {
  item: ActionItemWithSource;
  onStatusChange?: (id: string, status: Status) => void;
  onClick?: (item: ActionItemWithSource) => void;
}

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDone = item.status === 'done';
  const overdue = item.due_date && isOverdue(item.due_date, item.status);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

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
    setIsDropdownOpen(false);
    if (onStatusChange && newStatus !== item.status) {
      onStatusChange(item.id, newStatus);
    }
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
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
      className={`bg-white rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow cursor-pointer ${
        overdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
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
              ? 'bg-green-500 border-green-500 text-white cursor-default'
              : 'border-gray-300 hover:border-green-500 text-transparent hover:text-green-200'
          }`}
          title={isDone ? 'Completed' : 'Mark as done'}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Title */}
        <h4
          className={`flex-1 text-sm font-medium line-clamp-2 ${
            isDone ? 'text-gray-400 line-through' : 'text-gray-900'
          }`}
        >
          {item.title}
        </h4>
      </div>

      {/* Priority badge and due date row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_STYLES[item.priority]}`}
        >
          {item.priority}
        </span>

        {item.due_date && (
          <span
            className={`text-xs flex items-center gap-1 ${
              overdue ? 'text-red-600 font-medium' : 'text-gray-500'
            }`}
          >
            {overdue && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {formatDate(item.due_date)}
          </span>
        )}
      </div>

      {/* Footer: Source note link and Move to dropdown */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {/* Source note link */}
        <div className="flex-1 min-w-0">
          {item.meeting_note ? (
            <Link
              to={`/notes/${item.meeting_note.id}`}
              onClick={handleSourceLinkClick}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block"
              title={item.meeting_note.title || 'View source note'}
            >
              {item.meeting_note.title || 'Untitled Note'}
            </Link>
          ) : item.meeting_note_id ? (
            <span className="text-xs text-gray-400 italic">Note deleted</span>
          ) : null}
        </div>

        {/* Move to dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleDropdownToggle}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Move to..."
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <div className="px-3 py-1.5 text-xs text-gray-500 font-medium border-b border-gray-100">
                Move to
              </div>
              {(['todo', 'doing', 'done'] as Status[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusSelect(status)}
                  disabled={status === item.status}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                    status === item.status ? 'bg-gray-50 text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {STATUS_LABELS[status]}
                  {status === item.status && (
                    <span className="ml-2 text-xs text-gray-400">(current)</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
