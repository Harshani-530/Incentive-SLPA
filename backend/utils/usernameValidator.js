/**
 * Comprehensive username validation utility
 * 
 * Rules:
 * - Max 6 characters
 * - Must start with lowercase letter
 * - Only lowercase letters, numbers, dot (.), underscore (_) allowed
 * - No spaces or special characters
 * - Must not end with dot or underscore
 * - No consecutive dots or underscores
 * - Cannot be entirely numeric
 * - Reserved usernames are not allowed
 */

const RESERVED_USERNAMES = ['admin', 'root', 'superadmin', 'system', 'support', 'null', 'test'];

export function validateUsername(username, password = null) {
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

/**
 * Check if username already exists (case-insensitive)
 */
export async function checkUsernameExists(prisma, username, excludeId = null) {
  const existingUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive'
      },
      ...(excludeId && { id: { not: excludeId } })
    }
  });

  return existingUser !== null;
}
