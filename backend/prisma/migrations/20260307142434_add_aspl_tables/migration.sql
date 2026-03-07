-- CreateTable
CREATE TABLE "aspl_players" (
    "sl" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "batch" INTEGER NOT NULL,
    "playing_position" VARCHAR(10) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "randomized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "aspl_players_pkey" PRIMARY KEY ("sl")
);

-- CreateTable
CREATE TABLE "aspl_teams" (
    "id" INTEGER NOT NULL,
    "owner_sl" INTEGER NOT NULL,
    "team_name" VARCHAR(255) NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "aspl_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aspl_team_players" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_sl" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "aspl_team_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aspl_players_sl_key" ON "aspl_players"("sl");

-- CreateIndex
CREATE UNIQUE INDEX "aspl_teams_id_key" ON "aspl_teams"("id");

-- CreateIndex
CREATE UNIQUE INDEX "aspl_team_players_player_sl_team_id_key" ON "aspl_team_players"("player_sl", "team_id");

-- AddForeignKey
ALTER TABLE "aspl_team_players" ADD CONSTRAINT "aspl_team_players_player_sl_fkey" FOREIGN KEY ("player_sl") REFERENCES "aspl_players"("sl") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspl_team_players" ADD CONSTRAINT "aspl_team_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "aspl_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
