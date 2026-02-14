import { useState, useCallback } from 'react';
import { useExtractActionItems } from '../hooks/useMeetingNotes';
import { useBulkCreateActionItems } from '../hooks/useActionItems';
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
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
} as const;

const CONFIDENCE_STYLES = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
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
      <div className="border-t border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-800 font-medium mb-2">
            {isRateLimit
              ? 'Too many requests'
              : 'Failed to extract action items'}
          </p>
          <p className="text-red-600 text-sm mb-4">
            {isRateLimit
              ? 'Please wait a moment before trying again.'
              : error instanceof ApiError
                ? error.message
                : 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={handleExtract}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extracting state
  if (extractMutation.isPending) {
    return (
      <div className="border-t border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
            <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-blue-800 font-medium">Analyzing meeting notes...</p>
          <p className="text-blue-600 text-sm mt-1">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  // Review state - empty results (US-3.2)
  if (reviewItems !== null && reviewItems.length === 0) {
    return (
      <div className="border-t border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-700 font-medium mb-2">No action items found</p>
          <p className="text-gray-500 text-sm mb-4">
            The AI didn't find any action items in this note. Try adding more specific tasks, assignments, or deadlines to your meeting notes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Dismiss
            </button>
            <button
              onClick={handleExtract}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review state - items to review (US-3.1)
  if (reviewItems !== null && reviewItems.length > 0) {
    return (
      <div className="border-t border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Review Extracted Items</h3>
            {confidence && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CONFIDENCE_STYLES[confidence]}`}>
                {confidence} confidence
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {selectedCount} of {reviewItems.length} selected
          </span>
        </div>

        <div className="space-y-3 mb-4">
          {reviewItems.map((item, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 transition-colors ${
                item.included
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <label className="flex-shrink-0 mt-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.included}
                    onChange={() => handleToggleItem(index)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title input */}
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateTitle(index, e.target.value)}
                    disabled={!item.included}
                    className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-0.5 disabled:text-gray-400"
                  />

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
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
                      className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:text-gray-400"
                    />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={bulkCreateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedCount === 0 || bulkCreateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkCreateMutation.isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                Save {selectedCount} Item{selectedCount !== 1 ? 's' : ''} to Board
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Success state (brief)
  if (successCount !== null) {
    return (
      <div className="border-t border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-green-500 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-green-800 font-medium mb-2">
            {successCount} action item{successCount !== 1 ? 's' : ''} created
          </p>
          <p className="text-green-600 text-sm mb-4">
            Items have been added to your Action Board in the "To Do" column.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSuccessCount(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Dismiss
            </button>
            <button
              onClick={handleExtract}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Extract Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Idle state - default
  return (
    <div className="border-t border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <svg
          className="w-12 h-12 text-gray-400 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <p className="text-gray-600 mb-4">
          Use AI to extract action items from this meeting note.
        </p>
        <button
          onClick={handleExtract}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Extract Action Items
        </button>
      </div>
    </div>
  );
}
