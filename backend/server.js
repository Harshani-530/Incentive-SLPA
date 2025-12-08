import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import employeeRoutes from './routes/employees.js';
// calculationRoutes removed - calculations are transient and not persisted
import processRoutes from './routes/process.js';
import employeeDaysRoutes from './routes/employee-days.js';
import authRoutes from './routes/auth.js';
import changePasswordRoutes from './routes/change-password.js';
import monthlyReportsRoutes from './routes/monthly-reports.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/change-password', changePasswordRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/process', processRoutes);
app.use('/api/employee-days', employeeDaysRoutes);
app.use('/api/monthly-reports', monthlyReportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});

export { prisma };
