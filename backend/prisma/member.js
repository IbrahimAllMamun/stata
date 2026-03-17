// seed-test-members.js
// Creates 3 test members without password, status PENDING
// Run: node seed-test-members.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const members = [
    {
      batch: 10,
      full_name: 'Rafiul Islam',
      email: 'mimamun@isrt.ac.bd',
      phone_number: '+8801711000001',
      notify_events: true,
      status: 'PENDING',
    },
    {
      batch: 15,
      full_name: 'Nusrat Jahan',
      email: 'nusrat@isrt.ac.bd',
      phone_number: '+8801711000002',
      job_title: 'Data Analyst',
      organisation: 'Bangladesh Bank',
      notify_events: false,
      status: 'PENDING',
    },
    {
      batch: 22,
      full_name: 'Tanvir Ahmed',
      email: 'mimamun.isrt@gmail.com',
      phone_number: '+8801711000003',
      job_title: 'Statistician',
      organisation: 'BBS',
      blood_group: 'B+',
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