/**
 * Password validation utility
 * Rules:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@, #, $, %, &, *)
 * - No spaces
 * - Not same as username
 */

export function validatePassword(password, username = '') {
  const errors = []

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Check for special character
  if (!/[@#$%&*]/.test(password)) {
    errors.push('Password must contain at least one special character (@, #, $, %, &, *)')
  }

  // Check for spaces
  if (/\s/.test(password)) {
    errors.push('Password must not contain spaces')
  }

  // Check if password is same as username
  if (username && password.toLowerCase() === username.toLowerCase()) {
    errors.push('Password must not be the same as username')
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

/**
 * Check if password was used before
 * @param {Object} prisma - Prisma client
 * @param {number} userId - User ID
 * @param {string} newPassword - New password to check
 * @returns {Promise<boolean>} - True if password was used before
 */
export async function isPasswordReused(prisma, userId, newPassword) {
  const bcrypt = await import('bcrypt')
  
  // Get password history
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5 // Check last 5 passwords
  })

  // Check if new password matches any historical password
  for (const record of history) {
    const isMatch = await bcrypt.compare(newPassword, record.passwordHash)
    if (isMatch) {
      return true
    }
  }

  return false
}

/**
 * Save password to history
 * @param {Object} prisma - Prisma client
 * @param {number} userId - User ID
 * @param {string} passwordHash - Hashed password
 */
export async function savePasswordToHistory(prisma, userId, passwordHash) {
  await prisma.passwordHistory.create({
    data: {
      userId,
      passwordHash
    }
  })

  // Keep only last 5 passwords
  const allHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  if (allHistory.length > 5) {
    const toDelete = allHistory.slice(5)
    await prisma.passwordHistory.deleteMany({
      where: {
        id: {
          in: toDelete.map(h => h.id)
        }
      }
    })
  }
}
