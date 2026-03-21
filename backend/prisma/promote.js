const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.member.update({
    where: { email: 'mimamun@isrt.ac.bd' },
    data: { role: 'admin' }
}).then(m => {
    console.log('Promoted:', m.full_name);
    prisma.$disconnect();
});