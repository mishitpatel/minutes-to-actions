import { useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Zap, CheckCircle, FileText, ClipboardCheck, X } from 'lucide-react';
import { useExtractActionItems } from '../hooks/useMeetingNotes';
import { useBulkCreateActionItems } from '../hooks/useActionItems';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Spinner } from './ui/spinner';
import { Checkbox } from './ui/checkbox';
import type { ExtractedItem } from '../services/meeting-notes.service';
import type { Priority } from '../services/action-items.service';
import { ApiError } from '../services/api';

interface ExtractionReviewPanelProps {
  noteId: string;
}

interface ReviewItem extends ExtractedItem {
  included: boolean;
}

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
} as const;

const CONFIDENCE_STYLES = {
  high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent',
  low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-transparent',
} as const;

export function ExtractionReviewPanel({ noteId }: ExtractionReviewPanelProps) {
  const [reviewItems, setReviewItems] = useState<ReviewItem[] | null>(null);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low' | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const extractMutation = useExtractActionItems();
  const bulkCreateMutation = useBulkCreateActionItems();

  const handleExtract = useCallback(() => {
    setSuccessCount(null);
    extractMutation.mutate(noteId, {
      onSuccess: (result) => {
        setConfidence(result.confidence);
        if (result.action_items.length === 0) {
          setReviewItems([]);
        } else {
          setReviewItems(
            result.action_items.map((item) => ({ ...item, included: true }))
          );
        }
      },
    });
  }, [noteId, extractMutation]);

  const handleToggleItem = useCallback((index: number) => {
    setReviewItems((prev) =>
      prev?.map((item, i) =>
        i === index ? { ...item, included: !item.included } : item
      ) ?? null
    );
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setReviewItems((prev) => prev?.filter((_, i) => i !== index) ?? null);
  }, []);

  const handleUpdateTitle = useCallback((index: number, title: string) => {
    setReviewItems((prev) =>
      prev?.map((item, i) =>
        i === index ? { ...item, title } : item
      ) ?? null
    );
  }, []);

  const handleUpdatePriority = useCallback((index: number, priority: Priority) => {
    setReviewItems((prev) =>
      prev?.map((item, i) =>
        i === index ? { ...item, priority } : item
      ) ?? null
    );
  }, []);

  const handleUpdateDueDate = useCallback((index: number, due_date: string) => {
    setReviewItems((prev) =>
      prev?.map((item, i) =>
        i === index ? { ...item, due_date: due_date || null } : item
      ) ?? null
    );
  }, []);

  const handleCancel = useCallback(() => {
    setReviewItems(null);
    setConfidence(null);
    extractMutation.reset();
  }, [extractMutation]);

  const handleSave = useCallback(() => {
    if (!reviewItems) return;
    const selectedItems = reviewItems.filter((item) => item.included);
    if (selectedItems.length === 0) return;

    bulkCreateMutation.mutate(
      {
        meeting_note_id: noteId,
        items: selectedItems.map((item) => ({
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: 'todo' as const,
          due_date: item.due_date && !item.due_date.includes('T')
            ? `${item.due_date}T00:00:00.000Z`
            : item.due_date,
        })),
      },
      {
        onSuccess: (result) => {
          setSuccessCount(result.created_count);
          setReviewItems(null);
          setConfidence(null);
        },
      }
    );
  }, [reviewItems, noteId, bulkCreateMutation]);

  const selectedCount = reviewItems?.filter((item) => item.included).length ?? 0;

  // Error state
  if (extractMutation.isError) {
    const error = extractMutation.error;
    const isRateLimit = error instanceof ApiError && error.status === 429;

    return (
      <div className="border-t border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Action Items</h3>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
          <p className="text-destructive font-medium mb-2">
            {isRateLimit
              ? 'Too many requests'
              : 'Failed to extract action items'}
          </p>
          <p className="text-destructive/80 text-sm mb-4">
            {isRateLimit
              ? 'Please wait a moment before trying again.'
              : error instanceof ApiError
                ? error.message
                : 'An unexpected error occurred. Please try again.'}
          </p>
          <Button variant="destructive" onClick={handleExtract}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Extracting state
  if (extractMutation.isPending) {
    return (
      <div className="border-t border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Action Items</h3>
        <div className="bg-info/10 border border-info/20 rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
            <Spinner />
          </div>
          <p className="text-info font-medium">Analyzing meeting notes...</p>
          <p className="text-info/80 text-sm mt-1">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  // Review state - empty results (US-3.2)
  if (reviewItems !== null && reviewItems.length === 0) {
    return (
      <div className="border-t border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Action Items</h3>
        <div className="bg-muted rounded-lg p-6 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-foreground font-medium mb-2">No action items found</p>
          <p className="text-muted-foreground text-sm mb-4">
            The AI didn't find any action items in this note. Try adding more specific tasks, assignments, or deadlines to your meeting notes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Dismiss
            </Button>
            <Button onClick={handleExtract}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Review state - items to review (US-3.1)
  if (reviewItems !== null && reviewItems.length > 0) {
    return (
      <div className="border-t border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">Review Extracted Items</h3>
            {confidence && (
              <Badge className={CONFIDENCE_STYLES[confidence]}>
                {confidence} confidence
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {selectedCount} of {reviewItems.length} selected
          </span>
        </div>

        <div className="space-y-3 mb-4">
          {reviewItems.map((item, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 transition-colors ${
                item.included
                  ? 'border-border bg-card'
                  : 'border-border/50 bg-muted opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1.5">
                  <Checkbox
                    checked={item.included}
                    onCheckedChange={() => handleToggleItem(index)}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title input */}
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateTitle(index, e.target.value)}
                    disabled={!item.included}
                    className="w-full text-sm font-medium text-foreground bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:ring-0 px-0 py-0.5 disabled:text-muted-foreground"
                  />

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Priority and Due Date row */}
                  <div className="flex items-center gap-3">
                    <select
                      value={item.priority}
                      onChange={(e) => handleUpdatePriority(index, e.target.value as Priority)}
                      disabled={!item.included}
                      className={`text-xs px-2 py-1 rounded-full font-medium border cursor-pointer disabled:cursor-not-allowed ${PRIORITY_STYLES[item.priority]}`}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    <input
                      type="date"
                      value={item.due_date?.split('T')[0] ?? ''}
                      onChange={(e) => handleUpdateDueDate(index, e.target.value ? `${e.target.value}T00:00:00.000Z` : '')}
                      disabled={!item.included}
                      className="text-xs text-muted-foreground border border-input rounded px-2 py-1 focus:ring-1 focus:ring-ring focus:border-ring disabled:text-muted-foreground/50"
                    />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  title="Remove item"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={bulkCreateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedCount === 0 || bulkCreateMutation.isPending}
          >
            {bulkCreateMutation.isPending ? (
              <>
                <Spinner size="sm" className="text-current" />
                Saving...
              </>
            ) : (
              <>
                Save {selectedCount} Item{selectedCount !== 1 ? 's' : ''} to Board
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Success state (brief)
  if (successCount !== null) {
    return (
      <div className="border-t border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Action Items</h3>
        <div className="bg-success/10 border border-success/20 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
          <p className="text-foreground font-medium mb-2">
            {successCount} action item{successCount !== 1 ? 's' : ''} created
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            Items have been added to your Action Board in the "To Do" column.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => setSuccessCount(null)}>
              Dismiss
            </Button>
            <Button onClick={handleExtract}>
              Extract Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Idle state - default
  return (
    <div className="border-t border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Action Items</h3>
      <div className="bg-muted rounded-lg p-6 text-center">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-muted-foreground mb-4">
          Use AI to extract action items from this meeting note.
        </p>
        <Button onClick={handleExtract}>
          <Zap className="h-4 w-4" />
          Extract Action Items
        </Button>
      </div>
    </div>
  );
}
