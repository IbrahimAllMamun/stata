-- CreateEnum
CREATE TYPE "MemberUpdateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('PRESIDENT', 'GENERAL_SECRETARY');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "aspl_sport" AS ENUM ('FOOTBALL', 'CRICKET');

-- CreateEnum
CREATE TYPE "aspl_season_status" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "aspl_registration_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "batch" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "alternative_phone" TEXT,
    "job_title" TEXT,
    "organisation" TEXT,
    "organisation_address" TEXT,
    "notify_events" BOOLEAN NOT NULL,
    "photo_url" TEXT,
    "blood_group" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

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
    "blood_group" TEXT,
    "status" "MemberUpdateStatus" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "member_update_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_body" TEXT NOT NULL,
    "text_body" TEXT NOT NULL,
    "recipient_filter" TEXT NOT NULL DEFAULT 'ALL_NOTIFIABLE',
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" TEXT NOT NULL,
    "acting_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_members" (
    "id" TEXT NOT NULL,
    "committee_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cover_image" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "author_name" TEXT NOT NULL,
    "author_batch" INTEGER NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "event_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "banner_image" TEXT,
    "is_upcoming" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "batch" INTEGER,
    "designation" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'UNREAD',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_photos" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "moment_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_logs" (
    "id" SERIAL NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "visited_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_logs_pkey" PRIMARY KEY ("id")
);

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
    "registration_open" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aspl_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aspl_registrations" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "playing_position" VARCHAR(20) NOT NULL,
    "status" "aspl_registration_status" NOT NULL DEFAULT 'PENDING',
    "conflict_note" TEXT,
    "admin_note" TEXT,
    "player_sl" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aspl_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aspl_players" (
    "sl" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "member_email" VARCHAR(255) NOT NULL,
    "playing_position" VARCHAR(20) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "randomized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "aspl_players_pkey" PRIMARY KEY ("sl")
);

-- CreateTable
CREATE TABLE "aspl_teams" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "owner_name" VARCHAR(100) NOT NULL,
    "team_name" VARCHAR(255) NOT NULL,
    "logo_url" TEXT,
    "color" VARCHAR(7) NOT NULL DEFAULT '#2F5BEA',
    "balance" INTEGER NOT NULL,

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
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_batch_idx" ON "members"("batch");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "members"("status");

-- CreateIndex
CREATE INDEX "member_update_requests_member_id_idx" ON "member_update_requests"("member_id");

-- CreateIndex
CREATE INDEX "member_update_requests_status_idx" ON "member_update_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns"("status");

-- CreateIndex
CREATE INDEX "email_campaigns_created_at_idx" ON "email_campaigns"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "committees_acting_year_key" ON "committees"("acting_year");

-- CreateIndex
CREATE UNIQUE INDEX "committee_members_committee_id_position_key" ON "committee_members"("committee_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_slug_idx" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "posts"("status");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_event_date_idx" ON "events"("event_date");

-- CreateIndex
CREATE INDEX "events_is_upcoming_idx" ON "events"("is_upcoming");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

-- CreateIndex
CREATE INDEX "contact_messages_featured_idx" ON "contact_messages"("featured");

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");

-- CreateIndex
CREATE INDEX "gallery_photos_moment_date_idx" ON "gallery_photos"("moment_date");

-- CreateIndex
CREATE INDEX "gallery_photos_created_at_idx" ON "gallery_photos"("created_at");

-- CreateIndex
CREATE INDEX "visitor_logs_ip_idx" ON "visitor_logs"("ip");

-- CreateIndex
CREATE INDEX "visitor_logs_visited_at_idx" ON "visitor_logs"("visited_at");

-- CreateIndex
CREATE UNIQUE INDEX "aspl_registrations_email_season_id_key" ON "aspl_registrations"("email", "season_id");

-- CreateIndex
CREATE UNIQUE INDEX "aspl_players_sl_key" ON "aspl_players"("sl");

-- CreateIndex
CREATE UNIQUE INDEX "aspl_team_players_player_sl_team_id_key" ON "aspl_team_players"("player_sl", "team_id");

-- AddForeignKey
ALTER TABLE "member_update_requests" ADD CONSTRAINT "member_update_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspl_registrations" ADD CONSTRAINT "aspl_registrations_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "aspl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspl_players" ADD CONSTRAINT "aspl_players_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "aspl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspl_teams" ADD CONSTRAINT "aspl_teams_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "aspl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspl_team_players" ADD CONSTRAINT "aspl_team_players_player_sl_fkey" FOREIGN KEY ("player_sl") REFERENCES "aspl_players"("sl") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspl_team_players" ADD CONSTRAINT "aspl_team_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "aspl_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
