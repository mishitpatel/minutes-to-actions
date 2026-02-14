import { useState, useEffect } from 'react';
import { useActionItems } from '../hooks/useActionItems';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Spinner } from './ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
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
    }
  }, [open, defaultStatus]);

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isCreating && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Action Item</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* API Error */}
            {errors.api && (
              <Alert variant="destructive">
                <AlertDescription>{errors.api}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div>
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className={`mt-1 ${errors.title ? 'border-destructive' : ''}`}
                placeholder="Enter a title for this action item"
                autoFocus
              />
              {errors.title && (
                <p className="text-destructive text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 resize-none"
                placeholder="Add a description (optional)"
              />
            </div>

            {/* Priority and Status */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
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
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
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
            </div>

            {/* Due Date */}
            <div>
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Spinner size="sm" className="text-current" />}
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
