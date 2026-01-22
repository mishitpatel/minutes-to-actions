export interface BoardShare {
  id: string;
  meetingNoteId: string;
  shareToken: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateBoardShareInput {
  meetingNoteId: string;
  expiresAt?: Date;
}

export interface BoardSharePublic {
  shareToken: string;
  shareUrl: string;
  expiresAt: Date | null;
}
