# Username Validation Rules

## Overview
All usernames in the Incentive Calculation System must comply with strict validation rules to ensure security, consistency, and data integrity.

## Username Requirements

### Length
- **Minimum**: 2 characters
- **Maximum**: 6 characters

### Format Rules

1. **Must start with a lowercase letter** (a-z)
   - ✅ Valid: `john`, `admin`, `user1`
   - ❌ Invalid: `1john`, `_user`, `John`

2. **Allowed characters**:
   - Lowercase letters: `a-z`
   - Numbers: `0-9`
   - Dot: `.`
   - Underscore: `_`
   - ❌ No spaces, uppercase letters, or special characters

3. **Cannot end with dot or underscore**
   - ✅ Valid: `user1`, `john.d`, `j_doe`
   - ❌ Invalid: `user.`, `john_`, `test.`

4. **No consecutive dots or underscores**
   - ✅ Valid: `j.doe`, `u_ser`, `a.b.c`
   - ❌ Invalid: `j..doe`, `u__ser`, `a._b`

5. **Cannot be entirely numeric**
   - ✅ Valid: `user1`, `j123`, `a1b2`
   - ❌ Invalid: `123`, `456789`, `000`

6. **Cannot match password**
   - Username and password must be different

7. **Case-insensitive uniqueness**
   - If `john` exists, you cannot create `JOHN` or `John`

### Reserved Usernames
The following usernames are reserved and cannot be used:
- `admin`
- `root`
- `superadmin`
- `system`
- `support`
- `null`
- `test`

## Valid Username Examples
- `is` (Super Admin)
- `john`
- `user1`
- `j.doe`
- `u_ser`
- `a1b2c3`
- `abc123`

## Invalid Username Examples
| Username | Reason |
|----------|--------|
| `John` | Must start with lowercase letter |
| `1user` | Must start with lowercase letter |
| `_john` | Must start with lowercase letter |
| `user.` | Cannot end with dot or underscore |
| `jo..hn` | No consecutive dots |
| `u__ser` | No consecutive underscores |
| `123456` | Cannot be entirely numeric |
| `admin` | Reserved username |
| `user name` | Contains space |
| `user@123` | Contains special character @ |
| `JOHN` | Must be lowercase |
| `j` | Too short (minimum 2 characters) |
| `toolong` | Too long (maximum 6 characters) |

## Validation Implementation

### Backend
- Located in: `/backend/utils/usernameValidator.js`
- Used in: `/backend/routes/users.js`
- Validates on Admin and Operator creation

### Frontend
- Located in: `/src/utils/usernameValidator.ts`
- Real-time validation in:
  - SuperAdminPage (Create Admin form)
  - OperatorManagementPage (Create Operator form)
- Provides immediate feedback with error messages

## Error Messages

Clear, specific error messages guide users:
- "Username must start with a lowercase letter (a-z)"
- "Username can only contain lowercase letters (a-z), numbers (0-9), dot (.) and underscore (_)"
- "Username cannot end with a dot (.) or underscore (_)"
- "Username cannot contain consecutive dots (..) or underscores (__)"
- "Username cannot be entirely numeric"
- "Username 'admin' is reserved and cannot be used"
- "Username cannot be the same as password"
- "Username already exists"

## Security Benefits
1. **Predictable format**: Easier to validate and sanitize
2. **No injection attacks**: Limited character set prevents SQL/script injection
3. **Unique identifiers**: Case-insensitive uniqueness prevents confusion
4. **Reserved names protection**: Prevents impersonation of system accounts
5. **Password differentiation**: Reduces security risks from username-password similarity
