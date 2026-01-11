/**
 * Frontend username validation utility
 * Mirrors backend validation rules
 */

const RESERVED_USERNAMES = ['admin', 'root', 'superadmin', 'system', 'support', 'null', 'test'];

export function validateUsername(username: string, password?: string): { valid: boolean; error: string | null } {
  // Check if username is provided
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmedUsername = username.trim();

  // Check max length
  if (trimmedUsername.length > 6) {
    return { valid: false, error: 'Username cannot exceed 6 characters' };
  }

  // Check min length
  if (trimmedUsername.length < 2) {
    return { valid: false, error: 'Username must be at least 2 characters' };
  }

  // Must start with lowercase letter
  if (!/^[a-z]/.test(trimmedUsername)) {
    return { valid: false, error: 'Username must start with a lowercase letter (a-z)' };
  }

  // Only lowercase letters, numbers, dot, underscore allowed
  if (!/^[a-z0-9._]+$/.test(trimmedUsername)) {
    return { valid: false, error: 'Username can only contain lowercase letters (a-z), numbers (0-9), dot (.) and underscore (_)' };
  }

  // Must not end with dot or underscore
  if (/[._]$/.test(trimmedUsername)) {
    return { valid: false, error: 'Username cannot end with a dot (.) or underscore (_)' };
  }

  // No consecutive dots or underscores
  if (/[._]{2,}/.test(trimmedUsername)) {
    return { valid: false, error: 'Username cannot contain consecutive dots (..) or underscores (__)' };
  }

  // Cannot be entirely numeric
  if (/^\d+$/.test(trimmedUsername)) {
    return { valid: false, error: 'Username cannot be entirely numeric' };
  }

  // Check reserved usernames (case-insensitive)
  if (RESERVED_USERNAMES.includes(trimmedUsername.toLowerCase())) {
    return { valid: false, error: `Username "${trimmedUsername}" is reserved and cannot be used` };
  }

  // Cannot match password (if password provided)
  if (password && trimmedUsername === password) {
    return { valid: false, error: 'Username cannot be the same as password' };
  }

  return { valid: true, error: null };
}
