import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useActionItem, useActionItems } from '../hooks/useActionItems';
import { ConfirmDialog } from './ConfirmDialog';
import type { Priority, Status } from '../services/action-items.service';

interface ActionItemDetailModalProps {
  itemId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
} as const;

const STATUS_STYLES = {
  todo: 'bg-gray-100 text-gray-800',
  doing: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
} as const;

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'doing', label: 'Doing' },
  { value: 'done', label: 'Done' },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateForInput(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0] ?? '';
}

function isOverdue(dateString: string, status: Status): boolean {
  if (status === 'done') return false;
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export function ActionItemDetailModal({
  itemId,
  onClose,
  onDeleted,
}: ActionItemDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { data: item, isLoading, isError } = useActionItem(itemId ?? '');
  const { updateItem, isUpdating, deleteItem, isDeleting } = useActionItems();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('todo');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});

  // Reset form when item changes or modal opens
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description ?? '');
      setPriority(item.priority);
      setStatus(item.status);
      setDueDate(formatDateForInput(item.due_date));
      setErrors({});
      setIsEditing(false);
    }
  }, [item]);

  // Focus dialog when opened
  useEffect(() => {
    if (itemId) {
      dialogRef.current?.focus();
    }
  }, [itemId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && itemId && !isUpdating && !isDeleting && !showDeleteDialog) {
        if (isEditing) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [itemId, isUpdating, isDeleting, isEditing, showDeleteDialog, onClose]);

  if (!itemId) return null;

  const handleOverlayClick = () => {
    if (!isUpdating && !isDeleting) {
      if (isEditing) {
        handleCancelEdit();
      } else {
        onClose();
      }
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    if (item) {
      setTitle(item.title);
      setDescription(item.description ?? '');
      setPriority(item.priority);
      setStatus(item.status);
      setDueDate(formatDateForInput(item.due_date));
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = () => {
    // Validate
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrors({ title: 'Title is required' });
      return;
    }

    updateItem(
      {
        id: itemId,
        data: {
          title: trimmedTitle,
          description: description.trim() || null,
          priority,
          status,
          due_date: dueDate || null,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setErrors({});
        },
      }
    );
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteItem(itemId, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onDeleted?.();
        onClose();
      },
    });
  };

  const overdue = item?.due_date && isOverdue(item.due_date, item.status);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className="relative bg-white rounded-lg shadow-xl max-w-lg w-full focus:outline-none"
          >
            {/* Loading state */}
            {isLoading && (
              <div className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <svg
                    className="w-12 h-12 text-red-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Failed to load action item
                  </h3>
                  <p className="text-gray-500 mb-4">
                    The item may have been deleted or you don't have access.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            {!isLoading && !isError && item && (
              <>
                {/* Header with close button */}
                <div className="flex items-start justify-between p-4 border-b border-gray-200">
                  <div className="flex-1 min-w-0 pr-4">
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value);
                            if (errors.title) setErrors({});
                          }}
                          className={`w-full text-lg font-semibold text-gray-900 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.title ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Title"
                        />
                        {errors.title && (
                          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                        )}
                      </div>
                    ) : (
                      <h2
                        id="modal-title"
                        className="text-lg font-semibold text-gray-900"
                      >
                        {item.title}
                      </h2>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    disabled={isUpdating || isDeleting}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors disabled:opacity-50"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                  {/* Priority and Status */}
                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                          </label>
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {PRIORITY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Status)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <span
                          className={`text-sm px-3 py-1 rounded-full font-medium capitalize ${PRIORITY_STYLES[item.priority]}`}
                        >
                          {item.priority}
                        </span>
                        <span
                          className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_STYLES[item.status]}`}
                        >
                          {STATUS_OPTIONS.find((opt) => opt.value === item.status)?.label}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Due Date */}
                  <div>
                    {isEditing ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Due:</span>
                        {item.due_date ? (
                          <span
                            className={`text-sm ${
                              overdue ? 'text-red-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {overdue && (
                              <svg
                                className="w-4 h-4 inline mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {formatDate(item.due_date)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Not set</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    {isEditing ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Add a description..."
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-gray-500">Description</span>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                          {item.description || (
                            <span className="text-gray-400 italic">No description</span>
                          )}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Source Note (view mode only) */}
                  {!isEditing && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Source Note</span>
                      <div className="mt-1">
                        {item.meeting_note ? (
                          <Link
                            to={`/notes/${item.meeting_note.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {item.meeting_note.title || 'Untitled Note'}
                          </Link>
                        ) : item.meeting_note_id ? (
                          <span className="text-sm text-gray-400 italic">Note deleted</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">None</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamps (view mode only) */}
                  {!isEditing && (
                    <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                      <p>Created: {formatDateTime(item.created_at)}</p>
                      <p>Updated: {formatDateTime(item.updated_at)}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  {isEditing ? (
                    <>
                      <div />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating && (
                            <svg
                              className="animate-spin h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          )}
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={handleEditClick}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Action Item"
        message="Are you sure you want to delete this action item? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
