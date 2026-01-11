import express from 'express';
import { prisma } from '../server.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Search history by month and/or employee number
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { month, employeeNumber } = req.query;
    
    // Build filter object
    const where = {};
    
    if (month) {
      const monthDate = new Date(month + '-01');
      where.month = monthDate;
    }
    
    if (employeeNumber) {
      where.employeeNumber = employeeNumber.trim();
    }
    
    const history = await prisma.incentiveHistory.findMany({
      where,
      orderBy: [
        { month: 'desc' },
        { employeeName: 'asc' }
      ]
    });
    
    res.json(history);
  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all history (with pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [history, total] = await Promise.all([
      prisma.incentiveHistory.findMany({
        skip,
        take: parseInt(limit),
        orderBy: [
          { month: 'desc' },
          { employeeName: 'asc' }
        ]
      }),
      prisma.incentiveHistory.count()
    ]);
    
    res.json({
      data: history,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save history records (bulk insert)
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required' });
    }
    
    // Validate each record has required fields
    for (const record of records) {
      if (!record.employeeNumber || !record.employeeName || !record.month) {
        return res.status(400).json({ 
          error: 'Each record must have employeeNumber, employeeName, and month' 
        });
      }
    }
    
    // Convert month strings to Date objects
    const formattedRecords = records.map(record => ({
      employeeNumber: record.employeeNumber,
      employeeName: record.employeeName,
      designation: record.designation || null,
      jobWeight: record.jobWeight,
      noOfDays: parseFloat(record.noOfDays),
      oldRateAmount: parseFloat(record.oldRateAmount),
      newRateAmount: parseFloat(record.newRateAmount),
      month: new Date(record.month + '-01')
    }));
    
    // Use upsert to handle composite key properly (replace if exists)
    const results = await Promise.all(
      formattedRecords.map(record =>
        prisma.incentiveHistory.upsert({
          where: {
            month_employeeNumber: {
              month: record.month,
              employeeNumber: record.employeeNumber
            }
          },
          update: record,
          create: record
        })
      )
    );
    
    res.json({ 
      message: 'History records saved successfully',
      count: results.length 
    });
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete history records by month (for admin corrections)
router.delete('/month/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params;
    const monthDate = new Date(month + '-01');
    
    const result = await prisma.incentiveHistory.deleteMany({
      where: { month: monthDate }
    });
    
    res.json({ 
      message: 'History records deleted successfully',
      count: result.count 
    });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
