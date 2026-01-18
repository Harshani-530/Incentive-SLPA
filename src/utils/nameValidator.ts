/**
 * Name Validator
 * Validates names according to system requirements:
 * - Only alphabetic characters, single spaces, and dots (.)
 * - 2-30 characters length
 * - No leading/trailing spaces
 * - No multiple consecutive spaces
 * - Proper case formatting
 * - No numbers, special characters (except dot), emojis, or symbols
 */

export interface NameValidation {
  valid: boolean
  error?: string
}

/**
 * Validates a name field
 */
export function validateName(name: string): NameValidation {
  // Trim the name first
  const trimmedName = name.trim()
  
  // Check if empty
  if (!trimmedName) {
    return {
      valid: false,
      error: 'Name is required'
    }
  }
  
  // Check length (2-30 characters)
  if (trimmedName.length < 2) {
    return {
      valid: false,
      error: 'Name must be at least 2 characters'
    }
  }
  
  if (trimmedName.length > 30) {
    return {
      valid: false,
      error: 'Name must not exceed 30 characters'
    }
  }
  
  // Check for only alphabetic characters, single spaces, and dots
  // No numbers, special characters (except dot), emojis, or symbols
  const namePattern = /^[A-Za-z.]+( [A-Za-z.]+)*$/
  if (!namePattern.test(trimmedName)) {
    return {
      valid: false,
      error: 'Name must contain only letters, dots (.), and single spaces between words'
    }
  }
  
  // Check for multiple consecutive spaces (redundant with regex but explicit)
  if (/\s{2,}/.test(trimmedName)) {
    return {
      valid: false,
      error: 'Multiple consecutive spaces are not allowed'
    }
  }
  
  // Check for leading or trailing spaces in original input
  if (name !== trimmedName) {
    return {
      valid: false,
      error: 'Name must not have leading or trailing spaces'
    }
  }
  
  return { valid: true }
}

/**
 * Formats a name to proper case (first letter of each word capitalized)
 */
export function formatNameToProperCase(name: string): string {
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0) // Remove empty strings from multiple spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Sanitizes name input by removing invalid characters and formatting
 */
export function sanitizeName(name: string): string {
  // Remove all characters except letters and spaces
  let sanitized = name.replace(/[^A-Za-z\s]/g, '')
  
  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ')
  
  // Trim leading and trailing spaces
  sanitized = sanitized.trim()
  
  // Apply proper case formatting
  sanitized = formatNameToProperCase(sanitized)
  
  return sanitized
}

/**
 * Real-time name input handler
 * Filters invalid characters as user types
 */
export function filterNameInput(value: string): string {
  // Remove numbers, special characters, emojis, symbols
  // Keep only letters, dots (.), and spaces
  let filtered = value.replace(/[^A-Za-z.\s]/g, '')
  
  // Replace multiple consecutive spaces with single space
  filtered = filtered.replace(/\s{2,}/g, ' ')
  
  // Don't allow leading space
  if (filtered.startsWith(' ')) {
    filtered = filtered.trimStart()
  }
  
  return filtered
}
