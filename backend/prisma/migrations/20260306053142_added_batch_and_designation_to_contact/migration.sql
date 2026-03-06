-- AlterTable
ALTER TABLE "contact_messages" ADD COLUMN     "batch" INTEGER,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "contact_messages_featured_idx" ON "contact_messages"("featured");
