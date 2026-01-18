import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validateUsername, checkUsernameExists } from './utils/usernameValidator.js';

const prisma = new PrismaClient();

async function testCreateAdmin() {
  try {
    const username = 'admin1';
    const password = 'password123';
    const name = 'Test Admin';

    console.log('Step 1: Validating username...');
    const validation = validateUsername(username, password);
    console.log('Validation result:', validation);

    if (!validation.valid) {
      console.log('Validation failed:', validation.error);
      return;
    }

    console.log('Step 2: Checking if username exists...');
    const exists = await checkUsernameExists(prisma, username);
    console.log('Username exists?', exists);

    if (exists) {
      console.log('Username already exists!');
      return;
    }

    console.log('Step 3: Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    console.log('Step 4: Creating user in database...');
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null,
        role: 'Admin',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('✓ Success! User created:', newUser);

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateAdmin();
