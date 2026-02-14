import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Spinner } from './ui/spinner';

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
        <Label htmlFor="note-title">
          Title{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onChange?.({ title: e.target.value, body });
          }}
          placeholder="e.g., Weekly Team Standup"
          disabled={isSaving}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="note-body">
          Meeting Notes <span className="text-destructive">*</span>
        </Label>
        <div className="relative mt-1">
          <Textarea
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
            className={`resize-y ${error ? 'border-destructive' : ''}`}
          />
          {isGenerating && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" />
                Generating sample notes...
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving || (mode === 'edit' && !isFormDirty)}
        >
          {isSaving && <Spinner size="sm" className="text-current" />}
          {isSaving ? 'Saving...' : mode === 'create' ? 'Create Note' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
