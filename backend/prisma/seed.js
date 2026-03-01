// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('Seeded admin:', admin.username);
  console.log('Default credentials - username: admin, password: admin123');
  console.log('⚠️  Change the password immediately in production!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
