/*
  Warnings:

  - You are about to drop the column `caption` on the `gallery_photos` table. All the data in the column will be lost.
  - Added the required column `subject` to the `gallery_photos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gallery_photos" DROP COLUMN "caption",
ADD COLUMN     "subject" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "gallery_photos_subject_idx" ON "gallery_photos"("subject");
