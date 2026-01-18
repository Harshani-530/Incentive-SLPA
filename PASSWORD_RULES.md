# Password Security Rules

## Password Requirements

All passwords in the Incentive System must meet the following criteria:

### Minimum Requirements
1. **Length**: At least 8 characters
2. **Uppercase**: At least one uppercase letter (A-Z)
3. **Lowercase**: At least one lowercase letter (a-z)
4. **Number**: At least one digit (0-9)
5. **Special Character**: At least one special character from: `@`, `#`, `$`, `%`, `&`, `*`

### Restrictions
- **No Spaces**: Password must not contain any spaces
- **Not Same as Username**: Password cannot be the same as the username (case-insensitive)
- **No Password Reuse**: Cannot reuse any of the last 5 passwords

## Examples

### Valid Passwords
- `Admin@123` ✓
- `MyPass#456` ✓
- `Secure$789` ✓
- `Test%User1` ✓

### Invalid Passwords
- `admin123` ✗ (no uppercase, no special char)
- `ADMIN123` ✗ (no lowercase, no special char)
- `Admin123` ✗ (no special char)
- `Admin@` ✗ (too short, no number)
- `Admin 123@` ✗ (contains space)
- `admin` (when username is "admin") ✗ (same as username)

## Password History

The system maintains a history of the last 5 passwords for each user to prevent password reuse. When changing your password:
- You cannot use any of your last 5 passwords
- This helps ensure better security by preventing cycling through a small set of passwords

## Implementation Details

### Backend
- Password validation is enforced in: `backend/utils/passwordValidator.js`
- Password history is stored in the `password_history` table
- Passwords are hashed using bcrypt before storage
- Password history is automatically maintained (keeps last 5 passwords)

### Frontend
- Real-time password validation in: `src/utils/passwordValidator.ts`
- Validation feedback shown as user types
- Visual indicators for password strength
- Clear error messages for validation failures

## Password Strength Indicator

The system includes a password strength meter with three levels:
- **Weak** (0-40 points): Does not meet all requirements
- **Medium** (41-70 points): Meets basic requirements
- **Strong** (71-100 points): Meets all requirements with good length and complexity

## Applies To

These password rules apply to:
- ✓ Login password (when creating new users)
- ✓ Creating Admin users (Super Admin function)
- ✓ Creating Operator users (Admin function)
- ✓ Changing password (all users)
- ✓ Resetting passwords (Super Admin and Admin functions)

## Security Notes

1. **Never share passwords**: Each user should keep their password confidential
2. **Regular changes**: Consider changing passwords periodically
3. **Unique passwords**: Use different passwords for different systems
4. **Avoid common patterns**: Don't use predictable patterns like "Admin@123"
