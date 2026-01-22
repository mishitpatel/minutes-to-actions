export interface MeetingNote {
  id: string;
  userId: string;
  title: string;
  rawContent: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeetingNoteInput {
  title: string;
  rawContent: string;
}

export interface UpdateMeetingNoteInput {
  title?: string;
  rawContent?: string;
}
