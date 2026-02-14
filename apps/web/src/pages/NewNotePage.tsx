import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingNotes, useGenerateSample } from '../hooks/useMeetingNotes';
import { NoteEditor, type NoteEditorData } from '../components/NoteEditor';
import { ConfirmDialog } from '../components/ConfirmDialog';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingMeetingType, setPendingMeetingType] = useState<MeetingType | null>(null);
  const [externalData, setExternalData] = useState<NoteEditorData | undefined>(undefined);
  const [currentData, setCurrentData] = useState<NoteEditorData>({ title: '', body: '' });
  const lastMeetingTypeRef = useRef<MeetingType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setDropdownOpen(false);
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
      setDropdownOpen(false);
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
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
          aria-label="Back to notes"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Create New Note</h1>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={generateSample.isPending}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateSample.isPending ? (
              <svg
                className="animate-spin h-4 w-4 text-blue-600"
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
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            )}
            {generateSample.isPending ? 'Generating...' : 'Generate Sample'}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {MEETING_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectMeetingType(option.value)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {generateSample.isError && (
          <p className="text-sm text-red-600">
            Failed to generate sample.{' '}
            <button
              type="button"
              onClick={() => {
                if (lastMeetingTypeRef.current) {
                  doGenerate(lastMeetingTypeRef.current);
                }
              }}
              className="underline hover:text-red-800"
            >
              Retry
            </button>
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
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
