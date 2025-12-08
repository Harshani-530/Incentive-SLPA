import express from 'express'
import { prisma } from '../server.js'
import fs from 'fs/promises'
import path from 'path'
import xml2js from 'xml2js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Function to read rates from XML
async function getRatesFromXML() {
  try {
    const xmlPath = path.join(__dirname, '../data/rates.xml')
    const xmlData = await fs.readFile(xmlPath, 'utf-8')
    const parser = new xml2js.Parser()
    const result = await parser.parseStringPromise(xmlData)
    
    const rates = {}
    if (result.rates && result.rates.rate) {
      for (const rate of result.rates.rate) {
        const name = rate.name[0]
        const value = parseFloat(rate.value[0])
        if (name === 'Old Rate') rates.oldRate = value
        if (name === 'New Rate') rates.newRate = value
      }
    }
    return rates
  } catch (err) {
    console.error('Error reading rates from XML:', err)
    // Fallback to database if XML fails
    const oldRateRow = await prisma.rate.findUnique({ where: { rateName: 'Old Rate' } })
    const newRateRow = await prisma.rate.findUnique({ where: { rateName: 'New Rate' } })
    return {
      oldRate: parseFloat(String(oldRateRow?.value ?? '6')),
      newRate: parseFloat(String(newRateRow?.value ?? '2'))
    }
  }
}

// POST /api/process
// Body: { gateMovement, vesselAmount, month (YYYY-MM format), recordedBy }
// Reads EmployeeDays for the given month and computes old/new rate results separately
router.post('/', async (req, res, next) => {
  try {
    const { gateMovement, vesselAmount, month, recordedBy } = req.body || {}

    const a = parseFloat(String(gateMovement ?? '0'))
    const b = parseFloat(String(vesselAmount ?? '0'))

    // Load old/new rates from XML file
    const rates = await getRatesFromXML()
    const c = rates.oldRate
    const d = rates.newRate

    // Parse month filter (e.g., "2025-12" -> start of month)
    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required (YYYY-MM format)' })
    }
    const monthStart = new Date(`${month}-01T00:00:00.000Z`)
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)

    // Load employee days for the selected month
    const employeeDays = await prisma.employeeDays.findMany({
      where: {
        month: {
          gte: monthStart,
          lt: monthEnd
        }
      }
    })

    if (employeeDays.length === 0) {
      return res.status(400).json({ error: 'No employee days found for the selected month' })
    }

    // Compute g = sum(e*f) by looking up each employee's jobWeight
    let g = 0
    const rows = []
    for (const ed of employeeDays) {
      const emp = await prisma.employee.findUnique({ where: { employeeNumber: ed.employeeNumber } })
      if (!emp) continue
      const e = parseFloat(emp.jobWeight ?? '0')
      const f = ed.noOfDays
      const unit = e * f
      g += unit
      rows.push({ employee: emp, e, f, unit })
    }

    if (g === 0) return res.status(400).json({ error: 'Sum of (jobWeight * noOfDays) is zero. Cannot distribute amounts.' })

    const h = a * c // Gate Movement * Old Rate
    const i = a * d // Gate Movement * New Rate
    const j = (b + h) / g // Net amount per unit for Old Rate
    const k = (b + i) / g // Net amount per unit for New Rate

    // Generate separate results for old and new rates
    const oldRateResults = rows.map(r => ({
      employeeNumber: r.employee.employeeNumber,
      employeeName: r.employee.employeeName,
      jobWeight: r.e,
      noOfDays: r.f,
      unit: r.unit,
      netAmount: r.unit * j
    }))

    const newRateResults = rows.map(r => ({
      employeeNumber: r.employee.employeeNumber,
      employeeName: r.employee.employeeName,
      jobWeight: r.e,
      noOfDays: r.f,
      unit: r.unit,
      netAmount: r.unit * k
    }))

    res.json({
      success: true,
      details: { a, b, c, d, g, h, i, j, k },
      oldRateResults,
      newRateResults,
      recordedBy: recordedBy ?? 'system',
      month
    })
  } catch (err) {
    next(err)
  }
})

export default router
