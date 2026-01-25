import { useState, useEffect, useRef } from 'react';
import { useActionItems } from '../hooks/useActionItems';
import type { Priority, Status } from '../services/action-items.service';

interface ActionItemCreateModalProps {
  open: boolean;
  onClose: () => void;
  defaultStatus?: Status;
}

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

export function ActionItemCreateModal({
  open,
  onClose,
  defaultStatus = 'todo',
}: ActionItemCreateModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { createItem, isCreating } = useActionItems();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string; api?: string }>({});

  // Reset form when modal opens or defaultStatus changes
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus(defaultStatus);
      setDueDate('');
      setErrors({});
      dialogRef.current?.focus();
    }
  }, [open, defaultStatus]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isCreating) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, isCreating, onClose]);

  if (!open) return null;

  const handleOverlayClick = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrors({ title: 'Title is required' });
      return;
    }

    // Convert date to ISO 8601 format with time if provided
    let formattedDueDate: string | null = null;
    if (dueDate) {
      // Append time to make it a full ISO datetime (end of day)
      formattedDueDate = `${dueDate}T23:59:59.000Z`;
    }

    createItem(
      {
        title: trimmedTitle,
        description: description.trim() || null,
        priority,
        status,
        due_date: formattedDueDate,
        meeting_note_id: null,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          setErrors({
            api: error instanceof Error ? error.message : 'Failed to create action item',
          });
        },
      }
    );
  };

  return (
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
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-gray-200">
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                Create Action Item
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
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
              {/* API Error */}
              {errors.api && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.api}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter a title for this action item"
                  autoFocus
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add a description (optional)"
                />
              </div>

              {/* Priority and Status */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
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
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
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
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating && (
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
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
