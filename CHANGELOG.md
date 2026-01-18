# Incentive System - Changelog

## January 2026 - Password Security Enhancement

### 🔒 Password Security Update (v2.0)

#### New Password Requirements
All passwords must now meet these strict criteria:
- ✅ Minimum 8 characters (increased from 6)
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (@, #, $, %, &, *)
- ✅ No spaces allowed
- ✅ Cannot be same as username
- ✅ Cannot reuse last 5 passwords

#### Database Changes
- **New Table**: `password_history` - Tracks last 5 passwords per user
- **Migration**: `20260112052402_add_password_history`

#### Backend Enhancements
- **New File**: `backend/utils/passwordValidator.js` - Comprehensive password validation
- **Updated**: All user creation and password change endpoints enforce new rules
- **Enhanced**: Change password endpoint now checks password history

#### Frontend Improvements
- **New Component**: `PasswordInput.tsx` - Password field with show/hide toggle (👁️)
- **New Utility**: `src/utils/passwordValidator.ts` - Real-time password validation
- **Enhanced Pages**:
  - LoginPage - Password visibility toggle
  - SuperAdminPage - Real-time validation, visual feedback
  - OperatorManagementPage - Real-time validation, visual feedback
  - ChangePasswordModal - Show/hide on all password fields

#### User Experience
- 👁️ Show/hide password toggle on ALL password fields
- ⚠️ Real-time validation feedback as user types
- 📝 Clear error messages for each requirement
- 💡 Helper text showing password requirements
- 🔴 Visual indicators (red border) for invalid fields

#### Security Features
- Password history tracking (prevents reuse of last 5 passwords)
- bcrypt hashing with 10 rounds
- Server-side validation (authoritative)
- Client-side validation (user-friendly feedback)

#### Updated Credentials
- **Super Admin Username**: `is`
- **Super Admin Password**: `Admin@123` (changed from `is1234`)
- ⚠️ Change default password after first login!

#### Documentation
- **New**: `PASSWORD_RULES.md` - Detailed password requirements and examples
- **New**: `PASSWORD_IMPLEMENTATION.md` - Complete implementation summary
- **Updated**: `README.md` - Added password requirements section

#### Testing
- ✅ 18 comprehensive test cases (all passing)
- Test script: `backend/test-password-validation.mjs`

---

## December 2025 - Initial Release

### 1. **Verified Calculation Formulas**
- ✅ **j** = Net Amount per unit for **Old Rate** = `(b + h) / g` where `h = a * c`
- ✅ **k** = Net Amount per unit for **New Rate** = `(b + i) / g` where `i = a * d`

### 2. **New Database Table: EmployeeDays**
Created `employee_days` table to track employee work days per month:
- **Fields**: id, employeeNumber, noOfDays, month (date), createdAt
- **Unique constraint**: One record per employee per month
- **Migration applied**: `20251203103717_add_employee_days_table`

### 3. **Separate Old/New Rate Calculations**
Backend `/api/process` now:
- Accepts: `{ gateMovement, vesselAmount, month (YYYY-MM), recordedBy }`
- Returns: `{ oldRateResults[], newRateResults[], details }`
- Reads employee days from `employee_days` table for selected month
- Computes separate net amounts for old and new rates

### 4. **New Backend Routes**
Created `/api/employee-days`:
- `GET /api/employee-days?month=2025-12` - Fetch days for a month
- `POST /api/employee-days` - Add/update employee days (body: `{ employeeNumber, noOfDays, month }`)
- `DELETE /api/employee-days/:id` - Delete a record

### 5. **Completely Redesigned HomePage UI**
New features:
- **Month Selector** - Choose which month to work with (defaults to current month)
- **Add Employee Days** - Enter employee number (auto-fills name & job weight), add days, saves to DB
- **Employee Days Table** - Shows all employees with days added for selected month
- **Process Button** - Calculates old/new rate results separately using DB data
- **Results Display** - Two separate tables for old rate and new rate results
- **Three Export Buttons**:
  - Export Old Rate (Excel)
  - Export New Rate (Excel)
  - Export Both Rates (single Excel file with 2 sheets)
- **Calculation Details Panel** - Shows all formula values (a,b,c,d,g,h,i,j,k)

### 6. **Excel Export (xlsx)**
- Installed `xlsx` package
- Each export includes employee results + calculation details
- Filenames include month: `Incentive_Old_Rate_2025-12.xlsx`

### 7. **Updated API Service**
Removed old `calculationAPI`, added:
- `employeeDaysAPI` - CRUD for employee days
- `processAPI` - Process calculations by month

### 8. **Sample Data Seeded**
Created `backend/prisma/seed.mjs`:
- 5 sample employees (E001-E005)
- Old Rate: 1200.50, New Rate: 1350.75
- Employee days for December 2025 (18-22 days per employee)

## 📊 Current Database Schema

### Tables (Persisted)
1. **employees** - Employee master data
   - id, employeeNumber (unique), employeeName, jobWeight, createdAt, updatedAt

2. **rates** - Rate values (Old Rate / New Rate)
   - id, rateName (unique), value (Float), isActive, createdAt, updatedAt

3. **employee_days** - Monthly employee work days
   - id, employeeNumber, noOfDays (Float), month (DateTime), createdAt
   - Unique: (employeeNumber, month)

## 🚀 How to Use

### Start Servers
```powershell
# Backend (port 3001)
cd "D:\SLPA - IS\Insentive System\backend"
npm run dev

# Frontend (port 5174)
cd "D:\SLPA - IS\Insentive System"
npm run dev
```

### Workflow
1. **Select Month** - Choose the month you want to work with
2. **Add Employee Days**:
   - Enter employee number (E001, E002, etc.)
   - System auto-fills name and job weight
   - Enter number of days worked
   - Click "Add"
3. **View Employee Days Table** - Shows all employees added for the month
4. **Process Calculations**:
   - Enter Gate Movement (a) and Vessel Amount (b)
   - Click "Process"
   - System calculates using rates from DB and employee days from DB
5. **View Results**:
   - Old Rate Results table
   - New Rate Results table
   - Calculation Details panel
6. **Export to Excel**:
   - Export Old Rate only
   - Export New Rate only
   - Export Both (2 sheets in one file)

## 📁 Key Files Changed

### Backend
- `backend/prisma/schema.prisma` - Added EmployeeDays model
- `backend/routes/process.js` - Updated to read from DB, separate old/new results
- `backend/routes/employee-days.js` - New CRUD routes
- `backend/server.js` - Wired employee-days routes
- `backend/prisma/seed.mjs` - Sample data script

### Frontend
- `src/pages/HomePage.tsx` - Completely rewritten UI
- `src/pages/HomePage.css` - Updated styles
- `src/services/api.ts` - Added employeeDaysAPI, processAPI
- `package.json` - Added xlsx dependency

## 🎯 Key Features
✅ Monthly tracking of employee work days  
✅ One record per employee per month (upsert on save)  
✅ Separate old/new rate calculations  
✅ Three Excel export options  
✅ Auto-fill employee details when entering employee number  
✅ Calculation details displayed (a,b,c,d,g,h,i,j,k)  
✅ Clean, modern UI with tables and forms  

## 📝 Notes
- Calculations are performed server-side using DB data
- Employee days can be added/deleted per month
- Rates are read from `rates.value` (Old Rate / New Rate rows)
- To change rates: Use Prisma Studio or DB Browser to edit `rates.value`
  ```powershell
  cd backend
  npx prisma studio
  ```
