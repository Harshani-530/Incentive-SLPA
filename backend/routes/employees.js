import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { employeeNumber: 'asc' }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee by number
router.get('/number/:employeeNumber', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { employeeNumber: req.params.employeeNumber }
    });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee by name
router.get('/name/:employeeName', async (req, res) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { 
        employeeName: {
          contains: req.params.employeeName,
          mode: 'insensitive'
        }
      }
    });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const { employeeNumber, employeeName, designation, jobWeight } = req.body;
    
    // Check if employee already exists
    const existing = await prisma.employee.findUnique({
      where: { employeeNumber }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Employee number already exists' });
    }
    
    const employee = await prisma.employee.create({
      data: { employeeNumber, employeeName, designation, jobWeight }
    });
    
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee (jobWeight and designation)
router.patch('/:id', async (req, res) => {
  try {
    const { jobWeight, designation } = req.body;
    const updateData = {};
    if (jobWeight !== undefined) updateData.jobWeight = jobWeight;
    if (designation !== undefined) updateData.designation = designation;
    
    const employee = await prisma.employee.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
