// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const newUsername = process.env.SEED_ADMIN_USERNAME || '';
  const newPassword = process.env.SEED_ADMIN_PASSWORD || '';

  if (!newUsername || !newPassword) {
    console.log('No SEED_ADMIN_USERNAME or SEED_ADMIN_PASSWORD set — skipping seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const existing = await prisma.admin.findFirst({ where: { role: 'admin' } });

  if (!existing) {
    await prisma.admin.create({
      data: {
        username: newUsername,
        password: hashedPassword,
        role: 'admin',
      },
    });
    console.log(`Admin created: ${newUsername}`);
  } else {
    await prisma.admin.update({
      where: { id: existing.id },
      data: { username: newUsername, password: hashedPassword },
    });
    console.log(`Admin updated: ${existing.username} → ${newUsername}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());