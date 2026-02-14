import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, ChevronDown } from 'lucide-react';
import { useMeetingNotes, useGenerateSample } from '../hooks/useMeetingNotes';
import { NoteEditor, type NoteEditorData } from '../components/NoteEditor';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

type MeetingType = 'weekly-standup' | 'one-on-one' | 'sprint-retro';

const MEETING_TYPE_OPTIONS: { value: MeetingType; label: string }[] = [
  { value: 'weekly-standup', label: 'Weekly Standup' },
  { value: 'one-on-one', label: '1:1 Meeting' },
  { value: 'sprint-retro', label: 'Sprint Retrospective' },
];

export function NewNotePage() {
  const navigate = useNavigate();
  const { createNote, isCreating } = useMeetingNotes();
  const generateSample = useGenerateSample();
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingMeetingType, setPendingMeetingType] = useState<MeetingType | null>(null);
  const [externalData, setExternalData] = useState<NoteEditorData | undefined>(undefined);
  const [currentData, setCurrentData] = useState<NoteEditorData>({ title: '', body: '' });
  const lastMeetingTypeRef = useRef<MeetingType | null>(null);

  const handleSave = (data: NoteEditorData) => {
    setCurrentData(data);
    createNote(
      {
        title: data.title || undefined,
        body: data.body,
      },
      {
        onSuccess: (note) => {
          navigate(`/notes/${note.id}`);
        },
      }
    );
  };

  const handleCancel = () => {
    navigate('/notes');
  };

  const doGenerate = (meetingType: MeetingType) => {
    lastMeetingTypeRef.current = meetingType;
    generateSample.mutate(
      { meeting_type: meetingType },
      {
        onSuccess: (data) => {
          setExternalData({ title: data.title, body: data.body });
          setCurrentData({ title: data.title, body: data.body });
        },
      }
    );
  };

  const handleSelectMeetingType = (meetingType: MeetingType) => {
    const hasContent = currentData.title.trim() !== '' || currentData.body.trim() !== '';
    if (hasContent) {
      setPendingMeetingType(meetingType);
      setShowOverwriteConfirm(true);
    } else {
      doGenerate(meetingType);
    }
  };

  const handleConfirmOverwrite = () => {
    setShowOverwriteConfirm(false);
    if (pendingMeetingType) {
      doGenerate(pendingMeetingType);
      setPendingMeetingType(null);
    }
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteConfirm(false);
    setPendingMeetingType(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          aria-label="Back to notes"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Create New Note</h1>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={generateSample.isPending}
            >
              {generateSample.isPending ? (
                <Spinner size="sm" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              {generateSample.isPending ? 'Generating...' : 'Generate Sample'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {MEETING_TYPE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleSelectMeetingType(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {generateSample.isError && (
          <p className="text-sm text-destructive">
            Failed to generate sample.{' '}
            <button
              type="button"
              onClick={() => {
                if (lastMeetingTypeRef.current) {
                  doGenerate(lastMeetingTypeRef.current);
                }
              }}
              className="underline hover:text-destructive/80"
            >
              Retry
            </button>
          </p>
        )}
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <NoteEditor
          externalData={externalData}
          onSave={handleSave}
          onChange={setCurrentData}
          onCancel={handleCancel}
          isSaving={isCreating}
          isGenerating={generateSample.isPending}
          mode="create"
        />
      </div>

      <ConfirmDialog
        isOpen={showOverwriteConfirm}
        title="Overwrite existing content?"
        message="The editor already has content. Generating a sample will replace it. Do you want to continue?"
        confirmLabel="Overwrite"
        cancelLabel="Cancel"
        onConfirm={handleConfirmOverwrite}
        onCancel={handleCancelOverwrite}
      />
    </div>
  );
}
