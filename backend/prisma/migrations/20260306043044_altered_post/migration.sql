/*
  Warnings:

  - Added the required column `author_batch` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `author_name` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_created_by_fkey";

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "author_batch" INTEGER NOT NULL,
ADD COLUMN     "author_name" TEXT NOT NULL,
ADD COLUMN     "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "published" SET DEFAULT false,
ALTER COLUMN "created_by" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "posts"("status");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
