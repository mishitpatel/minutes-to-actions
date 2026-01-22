-- CreateTable
CREATE TABLE "meeting_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(500),
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_notes_user_id_idx" ON "meeting_notes"("user_id");

-- CreateIndex
CREATE INDEX "idx_meeting_notes_user_created" ON "meeting_notes"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
