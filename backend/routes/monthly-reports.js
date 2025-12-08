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

// Operator finish - lock Employee Days table
router.post('/operator-finish', authenticateToken, async (req, res) => {
  try {
    const { month } = req.body;
    const username = req.user.username;

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const monthDate = new Date(month + '-01');

    // Create or update monthly report
    const report = await prisma.monthlyReport.upsert({
      where: { month: monthDate },
      update: {
        operatorFinishedAt: new Date(),
        operatorFinishedBy: username,
        status: 'operator_finished'
      },
      create: {
        month: monthDate,
        operatorFinishedAt: new Date(),
        operatorFinishedBy: username,
        status: 'operator_finished'
      }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin finish - finalize all data
router.post('/admin-finish', authenticateToken, async (req, res) => {
  try {
    const { month, gateMovement, vesselAmount } = req.body;
    const username = req.user.username;

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const monthDate = new Date(month + '-01');

    // Create or update monthly report
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

// Override - unlock month for testing/development
router.post('/override', authenticateToken, async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const monthDate = new Date(month + '-01');

    // Delete the monthly report to unlock
    await prisma.monthlyReport.delete({
      where: { month: monthDate }
    }).catch(() => {
      // Ignore if doesn't exist
    });

    res.json({ message: 'Month unlocked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
