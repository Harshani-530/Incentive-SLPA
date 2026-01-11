# Super Admin Feature Documentation

## Overview
The Super Admin feature provides system-level administrative capabilities including user management and month reprocessing functionality.

## Super Admin Credentials
- **Username**: `superadmin`
- **Password**: `superadmin123`
- **⚠️ IMPORTANT**: Change the default password immediately after first login!

## Features

### 1. Create Admin Users
Super Admin can create new Admin users with:
- Custom username
- Custom password (minimum 6 characters)
- Password confirmation for security

### 2. Manage Users
View and manage all system users with capabilities to:
- View user list with role and status
- Activate/Deactivate users (except Super Admin)
- Reset user passwords
- See user creation dates

### 3. Reprocess Month
Unlock and reset any finalized month for data re-entry:
- Select year and month
- One-click reprocessing
- **Actions performed**:
  - Unlocks the month for data entry
  - Deletes all history records for that month
  - Resets monthly report status to "in_progress"
  - Clears localStorage cached data
  - **Preserves employee days data** (no need to re-enter)
- **⚠️ WARNING**: This action cannot be undone!

## Access & Navigation

### Login
1. Navigate to the login page
2. Enter Super Admin credentials
3. System automatically redirects to Super Admin Dashboard

### Navigation
- **Home Page**: Click "Super Admin" button (purple) in the top navigation
- **From Super Admin Page**: Click "Home" in the user dropdown menu

## User Roles

### Super Admin
- Full system access
- Create and manage Admin users
- Reprocess any month
- Cannot be deactivated or modified by other users

### Admin
- Can finalize months
- Can view history
- Can manage employees
- Can be created/managed by Super Admin

### Operator
- Can add employee days
- Can lock employee days
- Limited access to system features

## Security Features
- JWT token-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Protected API endpoints
- Super Admin-only middleware for sensitive operations

## API Endpoints

### User Management
- `GET /api/users` - Get all users (Super Admin only)
- `POST /api/users/create-admin` - Create Admin user (Super Admin only)
- `PATCH /api/users/:id/toggle-active` - Toggle user status (Super Admin only)
- `PATCH /api/users/:id/reset-password` - Reset user password (Super Admin only)

### Reprocessing
- `POST /api/monthly-reports/reprocess` - Reprocess month (Super Admin only)

## Technical Implementation

### Backend
- **Routes**: `backend/routes/users.js`
- **Middleware**: Super Admin authentication in users.js
- **Database**: Uses existing Prisma User model with "Super Admin" role

### Frontend
- **Page**: `src/pages/SuperAdminPage.tsx`
- **Styles**: `src/pages/SuperAdminPage.css`
- **API Service**: `src/services/api.ts` (usersAPI, superAdminAPI)
- **Route**: `/super-admin`

### Database Script
- **Creation Script**: `backend/prisma/create-superadmin.mjs`
- Run with: `node prisma/create-superadmin.mjs`

## Usage Workflow

### Creating an Admin User
1. Login as Super Admin
2. Navigate to Super Admin Dashboard
3. Fill in "Create Admin User" form:
   - Enter username
   - Enter password (min 6 chars)
   - Confirm password
4. Click "Create Admin"
5. New admin appears in user list

### Reprocessing a Month
1. Login as Super Admin
2. Navigate to Super Admin Dashboard
3. Scroll to "Reprocess Month" section
4. Select the month to reprocess
5. Click "Reprocess Month"
6. Confirm the action in the warning dialog
7. System unlocks the month and deletes all related data

### Managing Users
1. View all users in the "Manage Users" table
2. **Activate/Deactivate**: Click the status button (✓ or 🚫)
3. **Reset Password**: Click the key icon (🔑) and enter new password

## Best Practices
1. **Change default password** immediately after first login
2. **Backup data** before reprocessing any month
3. **Communicate** with team before unlocking finalized months
4. **Document** reasons for reprocessing in external logs
5. **Limit** Super Admin access to trusted personnel only

## Troubleshooting

### Cannot login as Super Admin
- Verify credentials: username `superadmin`, password `superadmin123`
- Check if Super Admin user exists in database
- Run creation script if needed: `node prisma/create-superadmin.mjs`

### Access Denied errors
- Ensure you're logged in as Super Admin
- Check JWT token is valid
- Clear browser cache and login again

### Reprocess fails
- Check database connection
- Verify month format (YYYY-MM)
- Check backend logs for errors
- Ensure Super Admin has proper permissions

## Future Enhancements
- Audit log for all Super Admin actions
- Bulk user creation from CSV
- Advanced user permission management
- Email notifications for password resets
- Two-factor authentication for Super Admin

---

**Last Updated**: December 23, 2025  
**Version**: 1.0.0
