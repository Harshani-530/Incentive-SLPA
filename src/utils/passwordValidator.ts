/**
 * Password validation utility (Frontend)
 * Rules:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@, #, $, %, &, *)
 * - No spaces
 * - Not same as username
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string, username: string = ''): PasswordValidationResult {
  const errors: string[] = []

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

export function getPasswordStrength(password: string): { strength: string; color: string; percentage: number } {
  let score = 0

  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 10
  if (/[A-Z]/.test(password)) score += 20
  if (/[a-z]/.test(password)) score += 20
  if (/[0-9]/.test(password)) score += 15
  if (/[@#$%&*]/.test(password)) score += 15

  if (score <= 40) {
    return { strength: 'Weak', color: '#dc3545', percentage: score }
  } else if (score <= 70) {
    return { strength: 'Medium', color: '#ffc107', percentage: score }
  } else {
    return { strength: 'Strong', color: '#28a745', percentage: score }
  }
}
