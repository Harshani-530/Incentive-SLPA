# Incentive Calculation System - Full Stack Setup

## Current Architecture

### **Frontend** (React + Vite)
- **Location**: `./` (root directory)
- **Port**: http://localhost:5173
- **Tech Stack**: React 18, TypeScript, Vite

### **Backend** (Node.js + Express + Prisma)
- **Location**: `./backend`
- **Port**: http://localhost:3001
- **Tech Stack**: Express.js, Prisma ORM, SQLite (dev)
- **Database**: SQLite (dev.db) - Can be changed to MySQL/PostgreSQL

---

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies (Already done)
npm install

# Generate Prisma Client (Already done)
npx prisma generate

# Run database migrations (Already done)
npx prisma migrate dev

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:3001**

### 2. Frontend Setup

```bash
# In root directory
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## Database Schema

### **Employees Table**
- `id` - Auto increment primary key
- `employeeNumber` - Unique employee identifier
- `employeeName` - Employee full name
- `jobWeight` - Job weight value
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### **Calculations Table**
- `id` - Auto increment primary key
- `employeeId` - Foreign key to Employee
- `noOfDays` - Number of working days
- `gateMovement` - Gate movement units (optional)
- `vesselAmount` - Vessel amount in Rs (optional)
- `rateType` - "Old Rate" or "New Rate"
- `calculatedDate` - Timestamp

### **Rates Table**
- `id` - Auto increment primary key
- `rateName` - Rate type name
- `isActive` - Boolean
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

---

## API Endpoints

### **Employee Endpoints**
- `GET /api/employees` - Get all employees
- `GET /api/employees/number/:employeeNumber` - Get employee by number
- `GET /api/employees/name/:employeeName` - Search by name
- `POST /api/employees` - Create new employee
- `PATCH /api/employees/:id` - Update job weight
- `DELETE /api/employees/:id` - Delete employee

### **Calculation Endpoints**
- `GET /api/calculations` - Get all calculations
- `POST /api/calculations` - Create calculation entry
- `PATCH /api/calculations/:id` - Update no. of days
- `DELETE /api/calculations/:id` - Delete calculation

---

## Running Both Servers

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

---

## Database Management

### View/Edit Database (Prisma Studio)
```bash
cd backend
npx prisma studio
```

This opens a visual database editor at http://localhost:5555

### Create New Migration
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

---

## Changing Database (Production)

### For MySQL:
1. Install MySQL
2. Update `backend/.env`:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/incentive_db"
   ```
3. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run: `npx prisma migrate dev`

### For PostgreSQL:
1. Install PostgreSQL
2. Update `backend/.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/incentive_db"
   ```
3. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run: `npx prisma migrate dev`

---

## File Structure

```
Insentive System/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── routes/
│   │   ├── employees.js           # Employee API routes
│   │   └── calculations.js        # Calculation API routes
│   ├── server.js                  # Express server
│   ├── package.json
│   ├── .env                       # Database config
│   └── README.md
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx           # Main page
│   │   └── AddEmployeePage.tsx    # Add employee page
│   ├── services/
│   │   └── api.ts                 # API service layer
│   └── ...
├── package.json
└── vite.config.ts
```

---

## Next Steps

1. ✅ Backend created with Prisma + Express
2. ✅ Database schema defined
3. ✅ API endpoints implemented
4. ✅ API service layer created
5. 🔄 Need to: Connect frontend components to backend API
6. 🔄 Need to: Add sample data to database

To add sample employees, use Prisma Studio:
```bash
cd backend
npx prisma studio
```
