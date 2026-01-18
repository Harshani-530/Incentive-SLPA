import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // New password that meets the requirements
    const newPassword = 'Admin@123'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update Super Admin password
    await prisma.user.update({
      where: { username: 'is' },
      data: { password: hashedPassword }
    })

    // Add to password history
    const user = await prisma.user.findUnique({
      where: { username: 'is' }
    })

    if (user) {
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash: hashedPassword
        }
      })
    }

    console.log('✅ Super Admin password updated successfully!')
    console.log('   Username: is')
    console.log('   Password: Admin@123')
    console.log('')
    console.log('⚠️  IMPORTANT: Change this password after first login!')
  } catch (error) {
    console.error('❌ Error updating Super Admin password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
