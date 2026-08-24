// prisma/checkCreatedByBackfill.js
//
// Read-only preflight for the 20260823170000_created_by_to_members migration.
//
// That migration repoints events/gallery_photos/email_campaigns/posts.created_by
// from `admins.id` at `members.id`, matching admins.username to members.email.
// Any row it cannot match loses its author (created_by becomes NULL), and that
// is not recoverable from the content tables afterwards.
//
// Run this against the target database FIRST. Anything it reports as unmatched
// is a row that will lose attribution — create or correct the corresponding
// member record before migrating if you want that authorship preserved.
//
//   DATABASE_URL="postgres://..." node prisma/checkCreatedByBackfill.js
//
// Exits 0 if every row can be mapped, 1 if any attribution would be dropped.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TABLES = ['events', 'gallery_photos', 'email_campaigns', 'posts'];

async function alreadyMigrated() {
  const [row] = await prisma.$queryRawUnsafe(`
    SELECT confrelid::regclass::text AS targets
      FROM pg_constraint
     WHERE conname = 'events_created_by_fkey'`);
  return row?.targets === 'members';
}

async function main() {
  if (await alreadyMigrated()) {
    console.log('events.created_by already references members — migration has been applied.');
    console.log('This preflight only describes the pre-migration state; nothing to check.');
    return;
  }

  console.log('Preflight: created_by (admins) -> created_by (members)\n');

  let totalUnmatched = 0;

  for (const table of TABLES) {
    const [counts] = await prisma.$queryRawUnsafe(`
      SELECT
        count(*) FILTER (WHERE t.created_by IS NULL)                      AS already_null,
        count(*) FILTER (WHERE m.id IS NOT NULL)                          AS will_map,
        count(*) FILTER (WHERE t.created_by IS NOT NULL AND m.id IS NULL) AS will_null
      FROM "${table}" t
      LEFT JOIN admins a  ON a.id = t.created_by
      LEFT JOIN members m ON lower(btrim(m.email)) = lower(btrim(a.username))`);

    const willNull = Number(counts.will_null);
    totalUnmatched += willNull;

    const flag = willNull > 0 ? '  <-- loses attribution' : '';
    console.log(
      `${table.padEnd(16)} ${String(counts.will_map).padStart(5)} mapped   ` +
      `${String(willNull).padStart(5)} nulled   ` +
      `${String(counts.already_null).padStart(5)} already null${flag}`
    );
  }

  const orphans = await prisma.$queryRawUnsafe(`
    SELECT a.id, a.username, a.role,
           (SELECT count(*) FROM events          WHERE created_by = a.id) AS events,
           (SELECT count(*) FROM gallery_photos  WHERE created_by = a.id) AS gallery_photos,
           (SELECT count(*) FROM email_campaigns WHERE created_by = a.id) AS email_campaigns,
           (SELECT count(*) FROM posts           WHERE created_by = a.id) AS posts
      FROM admins a
     WHERE NOT EXISTS (
             SELECT 1 FROM members m
              WHERE lower(btrim(m.email)) = lower(btrim(a.username)))
     ORDER BY a.created_at`);

  if (orphans.length) {
    console.log('\nAdmin rows with no matching member (username must equal a member email):');
    for (const o of orphans) {
      const owned = ['events', 'gallery_photos', 'email_campaigns', 'posts']
        .map(k => `${k}=${o[k]}`).join(' ');
      console.log(`  ${o.username}  [${o.role}]  ${owned}`);
    }
    console.log('\nTo preserve their authorship, make sure a member exists whose email');
    console.log('equals the username above, then re-run this check.');
  }

  console.log(
    totalUnmatched === 0
      ? '\nEvery attributed row maps to a member. Safe to migrate.'
      : `\n${totalUnmatched} row(s) would lose attribution.`
  );
  if (totalUnmatched > 0) process.exitCode = 1;
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
