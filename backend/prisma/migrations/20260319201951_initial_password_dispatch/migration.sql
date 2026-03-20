-- CreateTable
CREATE TABLE "initial_password_dispatches" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "initial_password_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "initial_password_dispatches_member_id_key" ON "initial_password_dispatches"("member_id");

-- AddForeignKey
ALTER TABLE "initial_password_dispatches" ADD CONSTRAINT "initial_password_dispatches_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
