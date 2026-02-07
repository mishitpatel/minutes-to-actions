import { useState, useEffect, useRef } from 'react';

export interface NoteEditorData {
  title: string;
  body: string;
}

interface NoteEditorProps {
  initialData?: NoteEditorData;
  externalData?: NoteEditorData;
  onSave: (data: NoteEditorData) => void;
  onChange?: (data: NoteEditorData) => void;
  onCancel: () => void;
  isSaving: boolean;
  isGenerating?: boolean;
  mode: 'create' | 'edit';
}

export function NoteEditor({
  initialData,
  externalData,
  onSave,
  onChange,
  onCancel,
  isSaving,
  isGenerating = false,
  mode,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [error, setError] = useState<string | null>(null);
  const lastExternalDataRef = useRef<NoteEditorData | undefined>(undefined);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setBody(initialData.body);
    }
  }, [initialData]);

  useEffect(() => {
    if (externalData && externalData !== lastExternalDataRef.current) {
      lastExternalDataRef.current = externalData;
      setTitle(externalData.title);
      setBody(externalData.body);
    }
  }, [externalData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError('Meeting notes content is required');
      return;
    }

    onSave({
      title: title.trim(),
      body: trimmedBody,
    });
  };

  const isFormDirty =
    title !== (initialData?.title ?? '') || body !== (initialData?.body ?? '');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="note-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onChange?.({ title: e.target.value, body });
          }}
          placeholder="e.g., Weekly Team Standup"
          disabled={isSaving}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      <div>
        <label
          htmlFor="note-body"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Meeting Notes <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            id="note-body"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              onChange?.({ title, body: e.target.value });
              if (error) setError(null);
            }}
            placeholder="Paste your meeting notes here..."
            rows={12}
            disabled={isSaving || isGenerating}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-y ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {isGenerating && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="animate-spin h-5 w-5 text-blue-600"
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
                Generating sample notes...
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || (mode === 'edit' && !isFormDirty)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving && (
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
          {isSaving ? 'Saving...' : mode === 'create' ? 'Create Note' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
