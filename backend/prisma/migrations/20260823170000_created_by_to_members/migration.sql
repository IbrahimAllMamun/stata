-- Repoint `created_by` from the legacy `admins` table at `members`.
--
-- Authentication runs entirely off `members`, so every id the API had to write
-- into `created_by` was a members UUID and violated the old foreign key
-- (events_created_by_fkey in production). src/utils/resolveAdminId.js worked
-- around that at the API level by resolving *some* admins row, which attributed
-- authorship correctly only when an admin's username happened to equal the
-- signed-in member's email. This migration removes the need for that shim.
--
-- Attribution becomes optional on all four tables. Every author that can be
-- resolved is preserved by matching admins.username to members.email; rows with
-- no matching member record NULL rather than being silently mis-attributed to
-- an unrelated account. Run `node prisma/checkCreatedByBackfill.js` against the
-- target database first to see exactly which rows that affects.
--
-- The `admins` table is deliberately NOT dropped here: it remains the only
-- record of the pre-migration authorship, so a mis-mapped backfill stays
-- recoverable. Drop it in a follow-up migration once production is verified.

-- 1. Release the legacy foreign keys.
ALTER TABLE "email_campaigns" DROP CONSTRAINT "email_campaigns_created_by_fkey";
ALTER TABLE "events" DROP CONSTRAINT "events_created_by_fkey";
ALTER TABLE "gallery_photos" DROP CONSTRAINT "gallery_photos_created_by_fkey";
ALTER TABLE "posts" DROP CONSTRAINT "posts_created_by_fkey";

-- 2. "unknown author" has to be representable before the backfill can run.
--    (posts.created_by is already nullable.)
ALTER TABLE "email_campaigns" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "events" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "gallery_photos" ALTER COLUMN "created_by" DROP NOT NULL;

-- 3. Backfill admins.id -> members.id, then clear whatever could not be mapped.
--    Matching is case- and whitespace-insensitive because admins.username was
--    hand-entered while members.email is normalised to lowercase on write.
DO $$
DECLARE
  tbl      text;
  mapped   bigint;
  cleared  bigint;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['email_campaigns', 'events', 'gallery_photos', 'posts'] LOOP
    EXECUTE format(
      'UPDATE %I t
          SET created_by = m.id
         FROM admins a
         JOIN members m ON lower(btrim(m.email)) = lower(btrim(a.username))
        WHERE t.created_by = a.id', tbl);
    GET DIAGNOSTICS mapped = ROW_COUNT;

    EXECUTE format(
      'UPDATE %I t
          SET created_by = NULL
        WHERE t.created_by IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM members m WHERE m.id = t.created_by)', tbl);
    GET DIAGNOSTICS cleared = ROW_COUNT;

    RAISE NOTICE '%: % row(s) mapped to a member, % row(s) had no matching member and were set to NULL',
      tbl, mapped, cleared;
  END LOOP;
END $$;

-- 4. Re-establish the foreign keys against `members`.
--    ON DELETE SET NULL, not RESTRICT: deleting a member is a supported admin
--    action (DELETE /admin/members/:id), and it must not be blocked by — or
--    cascade into — the content that member happened to create.
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
