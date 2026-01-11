import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateSuperAdmin() {
  try {
    // Hash new password
    const hashedPassword = await bcrypt.hash('is1234', 10);
    
    // Update Super Admin credentials
    const result = await prisma.user.updateMany({
      where: { role: 'Super Admin' },
      data: {
        username: 'is',
        password: hashedPassword
      }
    });

    if (result.count > 0) {
      console.log('✓ Super Admin credentials updated successfully!');
      console.log('  New Username: is');
      console.log('  New Password: is1234');
    } else {
      console.log('✗ No Super Admin found to update');
    }
  } catch (error) {
    console.error('Error updating Super Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuperAdmin();
