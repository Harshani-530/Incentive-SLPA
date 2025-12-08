import express from 'express'
import { prisma } from '../server.js'

const router = express.Router()

// GET /api/employee-days?month=2025-12
// Fetch all employee days for a specific month
router.get('/', async (req, res, next) => {
  try {
    const { month } = req.query
    
    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required (YYYY-MM format)' })
    }

    const monthStart = new Date(`${month}-01T00:00:00.000Z`)
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)

    const employeeDays = await prisma.employeeDays.findMany({
      where: {
        month: {
          gte: monthStart,
          lt: monthEnd
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch employee details for each record
    const enrichedData = await Promise.all(
      employeeDays.map(async (ed) => {
        const employee = await prisma.employee.findUnique({
          where: { employeeNumber: ed.employeeNumber }
        })
        return {
          ...ed,
          employeeName: employee?.employeeName || 'Unknown'
        }
      })
    )

    res.json(enrichedData)
  } catch (err) {
    next(err)
  }
})

// POST /api/employee-days
// Add or update employee days for a specific month
// Body: { employeeNumber, noOfDays, month (YYYY-MM) }
router.post('/', async (req, res, next) => {
  try {
    const { employeeNumber, noOfDays, month } = req.body

    if (!employeeNumber || noOfDays === undefined || !month) {
      return res.status(400).json({ error: 'employeeNumber, noOfDays, and month are required' })
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { employeeNumber }
    })

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    // Parse month to first day of month
    const monthDate = new Date(`${month}-01T00:00:00.000Z`)

    // Upsert (create or update) employee days record
    const employeeDays = await prisma.employeeDays.upsert({
      where: {
        employeeNumber_month: {
          employeeNumber,
          month: monthDate
        }
      },
      update: {
        noOfDays: parseFloat(noOfDays)
      },
      create: {
        employeeNumber,
        noOfDays: parseFloat(noOfDays),
        month: monthDate
      }
    })

    res.json(employeeDays)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/employee-days/:id
// Delete an employee days record
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    
    await prisma.employeeDays.delete({
      where: { id }
    })

    res.json({ success: true, message: 'Employee days record deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
