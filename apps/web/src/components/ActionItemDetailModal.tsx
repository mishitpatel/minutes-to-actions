import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useActionItem, useActionItems } from '../hooks/useActionItems';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Spinner } from './ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import type { Priority, Status } from '../services/action-items.service';

interface ActionItemDetailModalProps {
  itemId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-transparent',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent',
} as const;

const STATUS_STYLES = {
  todo: 'bg-secondary text-secondary-foreground border-transparent',
  doing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-transparent',
  done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent',
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
        id: itemId!,
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
    deleteItem(itemId!, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onDeleted?.();
        onClose();
      },
    });
  };

  const overdue = item?.due_date && isOverdue(item.due_date, item.status);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isUpdating && !isDeleting) {
      if (isEditing) {
        handleCancelEdit();
      } else {
        onClose();
      }
    }
  };

  return (
    <>
      <Dialog open={!!itemId} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          {/* Loading state */}
          {isLoading && (
            <div className="p-8">
              <div className="flex items-center justify-center">
                <Spinner />
              </div>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Failed to load action item
                </h3>
                <p className="text-muted-foreground mb-4">
                  The item may have been deleted or you don't have access.
                </p>
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !isError && item && (
            <>
              <DialogHeader>
                {isEditing ? (
                  <div>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors({});
                      }}
                      className={`text-lg font-semibold ${
                        errors.title ? 'border-destructive' : ''
                      }`}
                      placeholder="Title"
                    />
                    {errors.title && (
                      <p className="text-destructive text-sm mt-1">{errors.title}</p>
                    )}
                  </div>
                ) : (
                  <DialogTitle>{item.title}</DialogTitle>
                )}
              </DialogHeader>

              {/* Body */}
              <div className="space-y-4">
                {/* Priority and Status */}
                <div className="flex items-center gap-4">
                  {isEditing ? (
                    <>
                      <div className="flex-1">
                        <Label>Priority</Label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as Priority)}
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {PRIORITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <Label>Status</Label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as Status)}
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                      <Badge className={PRIORITY_STYLES[item.priority]}>
                        {item.priority}
                      </Badge>
                      <Badge className={STATUS_STYLES[item.status]}>
                        {STATUS_OPTIONS.find((opt) => opt.value === item.status)?.label}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  {isEditing ? (
                    <>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="mt-1"
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Due:</span>
                      {item.due_date ? (
                        <span
                          className={`text-sm ${
                            overdue ? 'text-destructive font-medium' : 'text-foreground'
                          }`}
                        >
                          {overdue && (
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                          )}
                          {formatDate(item.due_date)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Not set</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  {isEditing ? (
                    <>
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="mt-1 resize-none"
                        placeholder="Add a description..."
                      />
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-muted-foreground">Description</span>
                      <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                        {item.description || (
                          <span className="text-muted-foreground italic">No description</span>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Source Note (view mode only) */}
                {!isEditing && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Source Note</span>
                    <div className="mt-1">
                      {item.meeting_note ? (
                        <Link
                          to={`/notes/${item.meeting_note.id}`}
                          className="text-sm text-primary hover:text-primary/80 hover:underline"
                        >
                          {item.meeting_note.title || 'Untitled Note'}
                        </Link>
                      ) : item.meeting_note_id ? (
                        <span className="text-sm text-muted-foreground italic">Note deleted</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">None</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps (view mode only) */}
                {!isEditing && (
                  <div className="pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
                    <p>Created: {formatDateTime(item.created_at)}</p>
                    <p>Updated: {formatDateTime(item.updated_at)}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="sm:justify-between">
                {isEditing ? (
                  <>
                    <div />
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isUpdating}
                      >
                        {isUpdating && <Spinner size="sm" className="text-current" />}
                        {isUpdating ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                    >
                      Delete
                    </Button>
                    <Button
                      type="button"
                      onClick={handleEditClick}
                    >
                      Edit
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
