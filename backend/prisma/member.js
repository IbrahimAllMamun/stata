// seed-test-members.js
// Creates 3 test members without password, status PENDING
// Run: node seed-test-members.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const members = [
    {
      batch: 10,
      full_name: 'Md. Moinuzzaman Romel',
      email: 'romel473@gmail.com',
      phone_number: '+8801711000001',
      notify_events: true,
      status: 'PENDING',
    },
  ];

  for (const m of members) {
    const existing = await prisma.member.findUnique({ where: { email: m.email } });
    if (existing) {
      console.log(`Skipped (already exists): ${m.email}`);
      continue;
    }
    const created = await prisma.member.create({ data: m });
    console.log(`Created: ${created.full_name} (${created.email}) — Batch ${created.batch}`);
  }
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());