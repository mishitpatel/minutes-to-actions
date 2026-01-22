-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('todo', 'doing', 'done');

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meeting_note_id" TEXT,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "status" "Status" NOT NULL DEFAULT 'todo',
    "due_date" DATE,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "action_items_user_id_idx" ON "action_items"("user_id");

-- CreateIndex
CREATE INDEX "action_items_meeting_note_id_idx" ON "action_items"("meeting_note_id");

-- CreateIndex
CREATE INDEX "idx_action_items_user_status" ON "action_items"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_action_items_board_order" ON "action_items"("user_id", "status", "position");

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_note_id_fkey" FOREIGN KEY ("meeting_note_id") REFERENCES "meeting_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
