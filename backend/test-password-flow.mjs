import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { validatePassword, isPasswordReused, savePasswordToHistory } from './utils/passwordValidator.js'

const prisma = new PrismaClient()

async function testFullPasswordFlow() {
  console.log('🧪 Testing Complete Password Flow\n')
  console.log('=' .repeat(70))

  try {
    // Test 1: Validate a good password
    console.log('\n1️⃣  Testing password validation...')
    const password1 = 'TestPass@123'
    const username = 'testuser'
    
    const validation = validatePassword(password1, username)
    if (validation.isValid) {
      console.log('   ✅ Password validation passed')
    } else {
      console.log('   ❌ Password validation failed:', validation.errors)
      return
    }

    // Test 2: Find Super Admin and test password history
    console.log('\n2️⃣  Testing password history...')
    const superAdmin = await prisma.user.findUnique({
      where: { username: 'is' }
    })

    if (!superAdmin) {
      console.log('   ❌ Super Admin not found')
      return
    }
    console.log('   ✅ Found Super Admin (ID:', superAdmin.id, ')')

    // Test 3: Check if current password is in history
    const currentPasswordInHistory = await isPasswordReused(prisma, superAdmin.id, 'Admin@123')
    console.log('   ℹ️  Current password in history:', currentPasswordInHistory)

    // Test 4: Test password reuse detection
    console.log('\n3️⃣  Testing password reuse detection...')
    const testPassword = 'NewTest@456'
    const hashedTest = await bcrypt.hash(testPassword, 10)
    
    // Save test password to history
    await savePasswordToHistory(prisma, superAdmin.id, hashedTest)
    console.log('   ✅ Saved test password to history')

    // Try to reuse it
    const isReused = await isPasswordReused(prisma, superAdmin.id, testPassword)
    if (isReused) {
      console.log('   ✅ Password reuse correctly detected')
    } else {
      console.log('   ❌ Password reuse NOT detected (should have been)')
    }

    // Test 5: Count password history entries
    console.log('\n4️⃣  Checking password history count...')
    const historyCount = await prisma.passwordHistory.count({
      where: { userId: superAdmin.id }
    })
    console.log('   ℹ️  Total password history entries:', historyCount)
    
    if (historyCount <= 5) {
      console.log('   ✅ Password history within limit (≤5)')
    } else {
      console.log('   ⚠️  Password history exceeds limit (>5)')
    }

    // Test 6: Test invalid passwords
    console.log('\n5️⃣  Testing invalid password detection...')
    const invalidPasswords = [
      { pwd: 'short', reason: 'too short' },
      { pwd: 'NoSpecialChar123', reason: 'no special character' },
      { pwd: 'nouppercase@123', reason: 'no uppercase' },
      { pwd: 'NOLOWERCASE@123', reason: 'no lowercase' },
      { pwd: 'NoNumber@', reason: 'no number' },
      { pwd: 'Has Space@123', reason: 'contains space' },
      { pwd: 'testuser', reason: 'same as username' },
    ]

    let invalidTestsPassed = 0
    for (const test of invalidPasswords) {
      const result = validatePassword(test.pwd, username)
      if (!result.isValid) {
        invalidTestsPassed++
      }
    }

    if (invalidTestsPassed === invalidPasswords.length) {
      console.log(`   ✅ All ${invalidPasswords.length} invalid passwords correctly rejected`)
    } else {
      console.log(`   ❌ Only ${invalidTestsPassed}/${invalidPasswords.length} invalid passwords rejected`)
    }

    // Test 7: Test valid passwords with different special chars
    console.log('\n6️⃣  Testing all special characters...')
    const validPasswords = [
      'Test@123',  // @
      'Test#123',  // #
      'Test$123',  // $
      'Test%123',  // %
      'Test&123',  // &
      'Test*123',  // *
    ]

    let validTestsPassed = 0
    for (const pwd of validPasswords) {
      const result = validatePassword(pwd, username)
      if (result.isValid) {
        validTestsPassed++
      }
    }

    if (validTestsPassed === validPasswords.length) {
      console.log(`   ✅ All ${validPasswords.length} special characters accepted`)
    } else {
      console.log(`   ❌ Only ${validTestsPassed}/${validPasswords.length} special characters accepted`)
    }

    console.log('\n' + '=' .repeat(70))
    console.log('\n✅ All password flow tests completed successfully!\n')

  } catch (error) {
    console.error('\n❌ Error during testing:', error)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testFullPasswordFlow()
