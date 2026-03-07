/*
  Warnings:

  - You are about to drop the column `owner_sl` on the `aspl_teams` table. All the data in the column will be lost.
  - Added the required column `season_id` to the `aspl_players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_name` to the `aspl_teams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `season_id` to the `aspl_teams` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "aspl_sport" AS ENUM ('FOOTBALL', 'CRICKET');

-- CreateEnum
CREATE TYPE "aspl_season_status" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- DropIndex
DROP INDEX "aspl_teams_id_key";

-- AlterTable
ALTER TABLE "aspl_players" ADD COLUMN     "season_id" INTEGER NOT NULL,
ALTER COLUMN "playing_position" SET DATA TYPE VARCHAR(20);

-- AlterTable
CREATE SEQUENCE aspl_teams_id_seq;
ALTER TABLE "aspl_teams" DROP COLUMN "owner_sl",
ADD COLUMN     "color" VARCHAR(7) NOT NULL DEFAULT '#2F5BEA',
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "owner_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "season_id" INTEGER NOT NULL,
ALTER COLUMN "id" SET DEFAULT nextval('aspl_teams_id_seq'),
ALTER COLUMN "balance" DROP DEFAULT;
ALTER SEQUENCE aspl_teams_id_seq OWNED BY "aspl_teams"."id";

-- CreateTable
CREATE TABLE "aspl_seasons" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sport" "aspl_sport" NOT NULL,
    "status" "aspl_season_status" NOT NULL DEFAULT 'DRAFT',
    "max_squad_size" INTEGER NOT NULL DEFAULT 15,
    "min_squad_size" INTEGER NOT NULL DEFAULT 11,
    "min_bid_price" INTEGER NOT NULL DEFAULT 20,
    "starting_balance" INTEGER NOT NULL DEFAULT 1000,
    "total_players" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aspl_seasons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "aspl_players" ADD CONSTRAINT "aspl_players_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "aspl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspl_teams" ADD CONSTRAINT "aspl_teams_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "aspl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
