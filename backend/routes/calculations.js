import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// Get all calculations
router.get('/', async (req, res) => {
  try {
    const calculations = await prisma.calculation.findMany({
      include: {
        employee: true
      },
      orderBy: { calculatedDate: 'desc' }
    });
    res.json(calculations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new calculation
router.post('/', async (req, res) => {
  try {
    const { employeeId, noOfDays, gateMovement, vesselAmount, rateType } = req.body;
    
    const calculation = await prisma.calculation.create({
      data: {
        employeeId,
        noOfDays,
        gateMovement,
        vesselAmount,
        rateType
      },
      include: {
        employee: true
      }
    });
    
    res.status(201).json(calculation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update calculation (only noOfDays)
router.patch('/:id', async (req, res) => {
  try {
    const { noOfDays } = req.body;
    const calculation = await prisma.calculation.update({
      where: { id: parseInt(req.params.id) },
      data: { noOfDays },
      include: {
        employee: true
      }
    });
    res.json(calculation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete calculation
router.delete('/:id', async (req, res) => {
  try {
    await prisma.calculation.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Calculation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
