import { validatePassword } from './utils/passwordValidator.js'

console.log('🧪 Testing Password Validation\n')
console.log('=' .repeat(60))

const testCases = [
  { password: 'Admin@123', username: 'admin1', expected: true, description: 'Valid password' },
  { password: 'MyPass#456', username: 'user1', expected: true, description: 'Valid password with #' },
  { password: 'Secure$789', username: 'user2', expected: true, description: 'Valid password with $' },
  { password: 'Test%User1', username: 'user3', expected: true, description: 'Valid password with %' },
  { password: 'Pass&Word8', username: 'user4', expected: true, description: 'Valid password with &' },
  { password: 'Strong*99X', username: 'user5', expected: true, description: 'Valid password with *' },
  
  { password: 'admin123', username: 'admin1', expected: false, description: 'No uppercase, no special' },
  { password: 'ADMIN123', username: 'admin1', expected: false, description: 'No lowercase, no special' },
  { password: 'Admin123', username: 'admin1', expected: false, description: 'No special character' },
  { password: 'Admin@', username: 'admin1', expected: false, description: 'Too short, no number' },
  { password: 'Admin 123@', username: 'admin1', expected: false, description: 'Contains space' },
  { password: 'admin1', username: 'admin1', expected: false, description: 'Same as username' },
  { password: 'ADMIN1', username: 'admin1', expected: false, description: 'Same as username (case)' },
  { password: 'Short@1', username: 'user1', expected: false, description: 'Too short (7 chars)' },
  { password: 'NoNumber@', username: 'user1', expected: false, description: 'No number' },
  { password: 'nonumber@123', username: 'user1', expected: false, description: 'No uppercase' },
  { password: 'NOLOWER@123', username: 'user1', expected: false, description: 'No lowercase' },
  { password: 'NoSpecial123', username: 'user1', expected: false, description: 'No special character' },
]

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = validatePassword(test.password, test.username)
  const isPass = result.isValid === test.expected
  
  if (isPass) {
    passed++
    console.log(`✓ Test ${index + 1}: ${test.description}`)
    console.log(`  Password: "${test.password}" → ${result.isValid ? 'VALID' : 'INVALID'}`)
  } else {
    failed++
    console.log(`✗ Test ${index + 1}: ${test.description}`)
    console.log(`  Password: "${test.password}" → Expected ${test.expected}, Got ${result.isValid}`)
    if (!result.isValid) {
      console.log(`  Errors: ${result.errors.join(', ')}`)
    }
  }
  console.log('')
})

console.log('=' .repeat(60))
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`)

if (failed === 0) {
  console.log('✅ All password validation tests passed!')
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
