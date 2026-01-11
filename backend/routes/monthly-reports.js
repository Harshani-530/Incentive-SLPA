import express from 'express';
import { prisma } from '../server.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get monthly report by month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }

    const monthDate = new Date(month + '-01');
    const report = await prisma.monthlyReport.findUnique({
      where: { month: monthDate }
    });

    if (!report) {
      return res.json(null);
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stage 1: Lock Employee Days - Admin clicks "Finish" button
router.post('/lock-employee-days', authenticateToken, async (req, res) => {
  try {
    const { month } = req.body;
    const username = req.user.username;

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const monthDate = new Date(month + '-01');

    // Create or update monthly report with employee_days_locked status
    const report = await prisma.monthlyReport.upsert({
      where: { month: monthDate },
      update: {
        status: 'employee_days_locked',
        employeeDaysLockedAt: new Date(),
        employeeDaysLockedBy: username,
        updatedAt: new Date()
      },
      create: {
        month: monthDate,
        status: 'employee_days_locked',
        employeeDaysLockedAt: new Date(),
        employeeDaysLockedBy: username
      }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stage 2: Admin finish - finalize all data
router.post('/admin-finish', authenticateToken, async (req, res) => {
  try {
    const { month, gateMovement, vesselAmount } = req.body;
    const username = req.user.username;

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const monthDate = new Date(month + '-01');

    // Create or update monthly report with admin_finished status
    const report = await prisma.monthlyReport.upsert({
      where: { month: monthDate },
      update: {
        gateMovement: parseFloat(gateMovement) || null,
        vesselAmount: parseFloat(vesselAmount) || null,
        adminFinishedAt: new Date(),
        adminFinishedBy: username,
        status: 'admin_finished'
      },
      create: {
        month: monthDate,
        gateMovement: parseFloat(gateMovement) || null,
        vesselAmount: parseFloat(vesselAmount) || null,
        adminFinishedAt: new Date(),
        adminFinishedBy: username,
        status: 'admin_finished'
      }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reprocess month - Super Admin only
router.post('/reprocess', authenticateToken, async (req, res) => {
  try {
    const { month } = req.body;
    const userRole = req.user.role;

    // Only Super Admin can reprocess
    if (userRole !== 'Super Admin') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const monthDate = new Date(month + '-01');

    // Start transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete all history records for the month
      await tx.incentiveHistory.deleteMany({
        where: { month: monthDate }
      });

      // Reset monthly report to in_progress
      const existingReport = await tx.monthlyReport.findUnique({
        where: { month: monthDate }
      });

      if (existingReport) {
        await tx.monthlyReport.update({
          where: { month: monthDate },
          data: {
            status: 'in_progress',
            gateMovement: null,
            vesselAmount: null,
            employeeDaysLockedAt: null,
            employeeDaysLockedBy: null,
            adminFinishedAt: null,
            adminFinishedBy: null,
            updatedAt: new Date()
          }
        });
      }
    });

    res.json({ 
      message: `Month ${month} has been unlocked and history data has been deleted. Employee days data is preserved.` 
    });
  } catch (error) {
    console.error('Error reprocessing month:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
