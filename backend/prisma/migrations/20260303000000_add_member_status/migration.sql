-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'APPROVED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: add status column defaulting to APPROVED for existing members
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "status" "MemberStatus" NOT NULL DEFAULT 'APPROVED';

-- New registrations will default to PENDING (handled in application code)
-- Existing members are grandfathered as APPROVED

-- CreateIndex
CREATE INDEX IF NOT EXISTS "members_status_idx" ON "members"("status");