-- CreateEnum
CREATE TYPE "aspl_registration_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "aspl_players" ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "photo_url" TEXT;

-- CreateTable
CREATE TABLE "aspl_registrations" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "batch" INTEGER NOT NULL,
    "playing_position" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "photo_url" TEXT,
    "status" "aspl_registration_status" NOT NULL DEFAULT 'PENDING',
    "conflict_note" TEXT,
    "admin_note" TEXT,
    "player_sl" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aspl_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aspl_registrations_email_season_id_key" ON "aspl_registrations"("email", "season_id");

-- AddForeignKey
ALTER TABLE "aspl_registrations" ADD CONSTRAINT "aspl_registrations_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "aspl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
