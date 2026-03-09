/*
  Warnings:

  - You are about to drop the column `batch` on the `aspl_players` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `aspl_players` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `aspl_players` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `aspl_players` table. All the data in the column will be lost.
  - You are about to drop the column `batch` on the `aspl_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `aspl_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `aspl_registrations` table. All the data in the column will be lost.
  - Added the required column `member_email` to the `aspl_players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "aspl_players" DROP COLUMN "batch",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "member_email" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "aspl_registrations" DROP COLUMN "batch",
DROP COLUMN "full_name",
DROP COLUMN "phone";
