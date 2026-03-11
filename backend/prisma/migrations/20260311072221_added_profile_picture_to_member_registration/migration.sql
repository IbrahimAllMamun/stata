/*
  Warnings:

  - You are about to drop the column `photo_url` on the `aspl_players` table. All the data in the column will be lost.
  - You are about to drop the column `photo_url` on the `aspl_registrations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "aspl_players" DROP COLUMN "photo_url";

-- AlterTable
ALTER TABLE "aspl_registrations" DROP COLUMN "photo_url";

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "photo_url" TEXT;
