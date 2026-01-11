import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Check if Super Admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'Super Admin' }
    });

    if (existingSuperAdmin) {
      console.log('✓ Super Admin already exists:', existingSuperAdmin.username);
      return;
    }

    // Create Super Admin user
    const hashedPassword = await bcrypt.hash('is1234', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        username: 'is',
        password: hashedPassword,
        role: 'Super Admin',
        isActive: true
      }
    });

    console.log('✓ Super Admin created successfully!');
    console.log('  Username: is');
    console.log('  Password: is1234');
    console.log('  ⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('Error creating Super Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
