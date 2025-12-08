import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.employeeDays.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.rate.deleteMany()

  // Seed employees
  const employees = [
    { employeeNumber: 'E001', employeeName: 'John Silva', jobWeight: '10' },
    { employeeNumber: 'E002', employeeName: 'Mary Fernando', jobWeight: '8' },
    { employeeNumber: 'E003', employeeName: 'David Perera', jobWeight: '12' },
    { employeeNumber: 'E004', employeeName: 'Sarah Rodrigo', jobWeight: '9' },
    { employeeNumber: 'E005', employeeName: 'Mike Jayasinghe', jobWeight: '11' }
  ]

  for (const emp of employees) {
    await prisma.employee.create({ data: emp })
  }
  console.log(`✅ Created ${employees.length} employees`)

  // Seed rates
  await prisma.rate.create({
    data: { rateName: 'Old Rate', value: 1200.50, isActive: true }
  })
  await prisma.rate.create({
    data: { rateName: 'New Rate', value: 1350.75, isActive: true }
  })
  console.log('✅ Created rates (Old Rate: 1200.50, New Rate: 1350.75)')

  // Seed employee days for December 2025
  const december2025 = new Date('2025-12-01T00:00:00.000Z')
  const employeeDays = [
    { employeeNumber: 'E001', noOfDays: 20, month: december2025 },
    { employeeNumber: 'E002', noOfDays: 18, month: december2025 },
    { employeeNumber: 'E003', noOfDays: 22, month: december2025 },
    { employeeNumber: 'E004', noOfDays: 19, month: december2025 },
    { employeeNumber: 'E005', noOfDays: 21, month: december2025 }
  ]

  for (const ed of employeeDays) {
    await prisma.employeeDays.create({ data: ed })
  }
  console.log(`✅ Created ${employeeDays.length} employee days records for December 2025`)

  console.log('🎉 Seeding complete!')
}

seed()
  .catch((e) => {
    console.error('Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
