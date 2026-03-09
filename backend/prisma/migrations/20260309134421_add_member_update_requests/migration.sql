-- CreateEnum
CREATE TYPE "MemberUpdateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "member_update_requests" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "batch" INTEGER,
    "full_name" TEXT,
    "phone_number" TEXT,
    "alternative_phone" TEXT,
    "job_title" TEXT,
    "organisation" TEXT,
    "organisation_address" TEXT,
    "notify_events" BOOLEAN,
    "status" "MemberUpdateStatus" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "member_update_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_update_requests_member_id_idx" ON "member_update_requests"("member_id");

-- CreateIndex
CREATE INDEX "member_update_requests_status_idx" ON "member_update_requests"("status");

-- AddForeignKey
ALTER TABLE "member_update_requests" ADD CONSTRAINT "member_update_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
