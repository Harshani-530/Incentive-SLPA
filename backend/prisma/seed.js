import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample employees
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { employeeNumber: '001' },
      update: {},
      create: {
        employeeNumber: '001',
        employeeName: 'John Doe',
        jobWeight: '5',
      },
    }),
    prisma.employee.upsert({
      where: { employeeNumber: '002' },
      update: {},
      create: {
        employeeNumber: '002',
        employeeName: 'Jane Smith',
        jobWeight: '7',
      },
    }),
    prisma.employee.upsert({
      where: { employeeNumber: '003' },
      update: {},
      create: {
        employeeNumber: '003',
        employeeName: 'Mike Johnson',
        jobWeight: '6',
      },
    }),
  ]);

  console.log(`✅ Created ${employees.length} employees`);

  // Create rate types
  const rates = await Promise.all([
    prisma.rate.upsert({
      where: { rateName: 'Old Rate' },
      update: { value: 6 },
      create: {
        rateName: 'Old Rate',
        value: 6,
        isActive: true,
      },
    }),
    prisma.rate.upsert({
      where: { rateName: 'New Rate' },
      update: { value: 2 },
      create: {
        rateName: 'New Rate',
        value: 2,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${rates.length} rate types`);

  // Create users
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedOperatorPassword = await bcrypt.hash('operator123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedAdminPassword,
        role: 'Admin',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'operator' },
      update: {},
      create: {
        username: 'operator',
        password: hashedOperatorPassword,
        role: 'Operator',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);
  console.log('   - Username: admin, Password: admin123, Role: Admin');
  console.log('   - Username: operator, Password: operator123, Role: Operator');
  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
