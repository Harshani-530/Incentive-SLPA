# Database & Lock System Refactoring Summary

## Date: December 6, 2024

## Overview
This refactoring removes the Rate database table and migrates the locking system from localStorage-based to database-centric. The system now uses only XML files for rate configuration and stores all lock states in the database.

---

## 1. Database Changes

### Removed
- ✅ **Rate table** - Completely removed from schema and database
- ✅ **operatorFinishedAt** field from MonthlyReport table
- ✅ **operatorFinishedBy** field from MonthlyReport table

### Updated
- ✅ **MonthlyReport.status** values changed:
  - Old: `in_progress` | `operator_finished` | `admin_finished`
  - New: `in_progress` | `employee_days_locked` | `admin_finished`

### Migration Applied
- Migration file: `20251206000000_remove_rate_and_update_monthly_reports`
- Status: ✅ Applied successfully
- Prisma Client: ✅ Regenerated

---

## 2. Rate Data Source

### Before
- Rates stored in database `rates` table
- Fallback to XML if database empty
- process.js queried `prisma.rate.findMany()`

### After
- Rates **only** from XML file: `/backend/data/rates.xml`
- No database queries for rates
- Hardcoded fallback: `{oldRate: 6, newRate: 2}` if XML fails
- File: `backend/routes/process.js` - `getRatesFromXML()` function

---

## 3. Backend API Changes

### Removed Endpoints
- ❌ `/monthly-reports/operator-finish` (replaced)
- ❌ `/monthly-reports/override` (removed completely)

### New Endpoints
- ✅ `/monthly-reports/lock-employee-days` (POST)
  - Sets status to `employee_days_locked`
  - Marks Stage 1 completion
  - File: `backend/routes/monthly-reports.js`

### Updated Endpoints
- ✅ `/monthly-reports/admin-finish` (POST)
  - Sets status to `admin_finished`
  - Saves gateMovement and vesselAmount
  - Marks Stage 2 completion
  - File: `backend/routes/monthly-reports.js`

---

## 4. Frontend API Service Changes

### File: `src/services/api.ts`

#### Removed Functions
- ❌ `operatorFinish(month: string)`
- ❌ `override(month: string)`

#### Added Functions
- ✅ `lockEmployeeDays(month: string)` - Stage 1 lock
  - Calls `/monthly-reports/lock-employee-days`
  - Returns updated monthly report

#### Updated Functions
- ✅ `adminFinish(data)` - Stage 2 lock (updated comment only)
  - Calls `/monthly-reports/admin-finish`

---

## 5. Frontend HomePage Changes

### File: `src/pages/HomePage.tsx`

#### Lock Detection (Before)
```typescript
// OLD - localStorage-based
const finishedKey = `employeeDaysFinished_${selectedMonth}`
const isFinished = localStorage.getItem(finishedKey) === 'true'

const finalizedKey = `monthFinalized_${selectedMonth}`
const isFinalized = localStorage.getItem(finalizedKey) === 'true'
```

#### Lock Detection (After)
```typescript
// NEW - Database-based
const isEmployeeDaysLocked = monthlyReport?.status === 'employee_days_locked' 
  || monthlyReport?.status === 'admin_finished' 
  || employeeDaysFinished

const isAdminFinished = monthlyReport?.status === 'admin_finished'
```

#### handleFinishEmployeeDays (Before)
```typescript
// OLD - localStorage only
const finishedKey = `employeeDaysFinished_${selectedMonth}`
localStorage.setItem(finishedKey, 'true')
setEmployeeDaysFinished(true)
setShowProcessCalculations(true)
```

#### handleFinishEmployeeDays (After)
```typescript
// NEW - API call to database
await monthlyReportsAPI.lockEmployeeDays(selectedMonth)
setEmployeeDaysFinished(true)
setShowProcessCalculations(true)
await loadMonthlyReport()
```

#### handleAdminFinish (Before)
```typescript
// OLD - localStorage for status
const finalizedKey = `monthFinalized_${selectedMonth}`
localStorage.setItem(finalizedKey, 'true')
localStorage.setItem(savedDataKey, JSON.stringify(dataToSave))
```

#### handleAdminFinish (After)
```typescript
// NEW - Only save display data to localStorage
localStorage.setItem(savedDataKey, JSON.stringify(dataToSave))
// No finalized key - status comes from database
```

#### Variable Renaming
- ✅ All `isOperatorFinished` → `isEmployeeDaysLocked`
- ✅ Removed `isMonthFinalized` variable (replaced with `isAdminFinished`)

---

## 6. localStorage Usage

### Before (5+ keys)
- ❌ `employeeDaysFinished_YYYY-MM` - lock status
- ❌ `monthFinalized_YYYY-MM` - finalized status
- ✅ `monthData_YYYY-MM` - process calculations display data
- ✅ `token` - JWT authentication
- ✅ `user` - User object

### After (3 keys)
- ✅ `monthData_YYYY-MM` - **KEPT** for displaying finalized month data
- ✅ `token` - **KEPT** for authentication
- ✅ `user` - **KEPT** for user info

### monthData Structure
```json
{
  "gateMovement": "1000.00",
  "vesselAmount": "500.00",
  "oldRateResults": [...],
  "newRateResults": [...],
  "processDetails": {...}
}
```

---

## 7. Workflow Changes

### Two-Stage Locking System

#### Stage 1: Lock Employee Days
1. Admin clicks **"Finish"** button
2. Frontend calls `monthlyReportsAPI.lockEmployeeDays(selectedMonth)`
3. Backend sets `status = 'employee_days_locked'` in database
4. **"Process Calculations"** section appears
5. Employee data editing disabled

#### Stage 2: Admin Finalize
1. Admin enters Gate Movement and Vessel Amount
2. Admin clicks **"Process Calculations"**
3. Results displayed in tables
4. Admin clicks **"Finalize Month"** button
5. Frontend calls `monthlyReportsAPI.adminFinish({month, gateMovement, vesselAmount})`
6. Backend sets `status = 'admin_finished'` in database
7. Data saved to `monthData_YYYY-MM` in localStorage for display
8. All editing disabled, Excel reports available

---

## 8. Data Flow Summary

### Employee Days Lock (Stage 1)
```
User clicks "Finish"
  ↓
API: POST /monthly-reports/lock-employee-days
  ↓
Database: UPDATE monthly_reports SET status='employee_days_locked'
  ↓
Frontend: Show "Process Calculations" section
```

### Admin Finalize (Stage 2)
```
User clicks "Finalize Month"
  ↓
API: POST /monthly-reports/admin-finish
  ↓
Database: UPDATE monthly_reports 
  SET status='admin_finished', 
      gateMovement=X, 
      vesselAmount=Y
  ↓
localStorage: Save monthData_YYYY-MM for display
  ↓
Frontend: Enable Excel export buttons
```

### Rate Retrieval
```
Process Calculations triggered
  ↓
backend/routes/process.js: getRatesFromXML()
  ↓
Read: backend/data/rates.xml
  ↓
Parse XML → {oldRate: 6, newRate: 2}
  ↓
If XML fails → Hardcoded fallback
```

---

## 9. Files Modified

### Backend
1. ✅ `backend/prisma/schema.prisma` - Removed Rate model, updated MonthlyReport
2. ✅ `backend/routes/process.js` - Removed database rate queries
3. ✅ `backend/routes/monthly-reports.js` - Updated endpoints
4. ✅ `backend/prisma/migrations/.../migration.sql` - Database migration

### Frontend
1. ✅ `src/services/api.ts` - Updated API functions
2. ✅ `src/pages/HomePage.tsx` - Updated lock logic and handlers

---

## 10. Testing Checklist

### Database
- [x] Rate table removed from database
- [x] MonthlyReport schema updated
- [x] Migration applied successfully
- [x] Prisma Client regenerated

### Backend
- [ ] Lock employee days endpoint works
- [ ] Admin finish endpoint works
- [ ] Status changes saved correctly
- [ ] Rates loaded from XML only

### Frontend
- [ ] Stage 1 lock (Finish button) works
- [ ] Stage 2 lock (Finalize Month button) works
- [ ] Lock detection uses database status
- [ ] Process calculations display correctly
- [ ] Excel export works after finalization
- [ ] Month switching loads correct data

### localStorage
- [ ] No employeeDaysFinished_* keys created
- [ ] No monthFinalized_* keys created
- [ ] monthData_* keys saved correctly
- [ ] Finalized month data loads from localStorage

---

## 11. Rollback Plan

If issues occur, to rollback:

1. **Restore Rate Table**
   ```sql
   CREATE TABLE "rates" (
       "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
       "type" TEXT NOT NULL,
       "value" REAL NOT NULL,
       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" DATETIME NOT NULL
   );
   INSERT INTO "rates" ("type", "value") VALUES ('old', 6), ('new', 2);
   ```

2. **Restore MonthlyReport Fields**
   ```sql
   ALTER TABLE "monthly_reports" ADD COLUMN "operatorFinishedAt" DATETIME;
   ALTER TABLE "monthly_reports" ADD COLUMN "operatorFinishedBy" TEXT;
   ```

3. **Restore Frontend Code**
   - Revert git commits for api.ts and HomePage.tsx
   - Restore localStorage lock keys

---

## 12. Benefits of Refactoring

✅ **Simplified Data Sources**
- Single source of truth for rates (XML)
- No database/XML sync issues

✅ **Centralized Lock Management**
- All lock states in database
- No localStorage/database conflicts
- Consistent across sessions/devices

✅ **Cleaner Code**
- Removed unused override functionality
- Removed operator role (not implemented)
- Simpler status flow

✅ **Better Performance**
- No unnecessary database queries for rates
- Faster lock status checks

✅ **Easier Maintenance**
- Fewer localStorage keys to manage
- Clear separation: DB for state, localStorage for display cache

---

## 13. Next Steps

1. ✅ Complete testing checklist above
2. ✅ Verify data integrity in production-like environment
3. ✅ Update user documentation
4. ✅ Train users on new workflow (if needed)
5. ✅ Monitor for any issues after deployment

---

## Questions or Issues?

Contact: Development Team
Date: December 6, 2024
