-- AlterTable
ALTER TABLE "members" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expires" TIMESTAMP(3),
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';
