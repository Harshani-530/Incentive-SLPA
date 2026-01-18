import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'Super Admin' }
    });

    console.log('Super Admin users found:');
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Username: "${u.username}", Active: ${u.isActive}`);
    });

    if (users.length === 0) {
      console.log('No Super Admin found!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
