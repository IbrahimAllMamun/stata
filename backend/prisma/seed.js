// prisma/seed.js
//
// Bootstraps the first staff account. Authentication runs entirely off the
// `members` table, so this promotes (or creates) a member and gives it
// role='admin' — there is no separate admins table login any more.
//
// Without this there is a chicken-and-egg on a fresh deployment: promoting a
// member to admin requires PATCH /admin/members/:id/role, which itself
// requires an existing admin.
//
//   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=... npm run prisma:seed
//
// Safe to re-run: it upserts by email and only ever raises privileges.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.log('No SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD set — skipping seed.');
    return;
  }
  if (password.length < 8) {
    console.error('SEED_ADMIN_PASSWORD must be at least 8 characters.');
    process.exitCode = 1;
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const existing = await prisma.member.findUnique({ where: { email } });

  if (existing) {
    // Only touch auth and visibility — never overwrite real directory details.
    await prisma.member.update({
      where: { email },
      data: {
        role: 'admin',
        password: hashed,
        status: 'APPROVED',
        must_change_password: false,
        reset_token: null,
        reset_token_expires: null,
      },
    });
    console.log(`Admin promoted: ${existing.full_name} <${email}>`);
    return;
  }

  // No such member yet — create a minimal placeholder record. The profile
  // fields are not secrets and are meant to be corrected from the UI later.
  const created = await prisma.member.create({
    data: {
      email,
      full_name: process.env.SEED_ADMIN_NAME?.trim() || email.split('@')[0],
      batch: parseInt(process.env.SEED_ADMIN_BATCH || '', 10) || 0,
      phone_number: '',
      notify_events: false,
      status: 'APPROVED',
      role: 'admin',
      password: hashed,
      must_change_password: false,
    },
  });
  console.log(`Admin created: ${created.full_name} <${email}>`);
  console.log('Placeholder profile — set batch, name and phone from Account Management.');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
