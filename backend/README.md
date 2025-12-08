# Incentive Calculation System - Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
Edit the `.env` file and set your database connection:

- **SQLite (Development)**: Already configured
- **MySQL**: `DATABASE_URL="mysql://username:password@localhost:3306/incentive_db"`
- **PostgreSQL**: `DATABASE_URL="postgresql://username:password@localhost:5432/incentive_db"`

### 3. Initialize Database
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Seed Sample Data (Optional)
Create some test employees:
```bash
npx prisma studio
```

### 5. Start Backend Server
```bash
npm run dev
```

Backend will run on: **http://localhost:3001**

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/number/:employeeNumber` - Get by employee number
- `GET /api/employees/name/:employeeName` - Search by name
- `POST /api/employees` - Create employee
- `PATCH /api/employees/:id` - Update job weight
- `DELETE /api/employees/:id` - Delete employee

### Calculations
- `GET /api/calculations` - Get all calculations
- `POST /api/calculations` - Create calculation
- `PATCH /api/calculations/:id` - Update no. of days
- `DELETE /api/calculations/:id` - Delete calculation

## Database Schema

### Employee
- employeeNumber (unique)
- employeeName
- jobWeight

### Calculation
- employeeId
- noOfDays
- gateMovement
- vesselAmount
- rateType

## Development Tools

- **Prisma Studio**: `npm run prisma:studio` - Visual database editor
- **Migrations**: `npm run prisma:migrate` - Create database migrations
