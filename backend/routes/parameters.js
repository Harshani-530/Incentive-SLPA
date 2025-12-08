import express from 'express'
import { prisma } from '../server.js'

const router = express.Router()

// Get all parameters
router.get('/', async (req, res, next) => {
  try {
    const params = await prisma.parameter.findMany()
    res.json(params)
  } catch (err) {
    next(err)
  }
})

// Upsert parameters (expects array of { parameter, value })
router.post('/', async (req, res, next) => {
  try {
    const items = req.body
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected an array' })

    const results = []
    for (const it of items) {
      const { parameter, value } = it
      const up = await prisma.parameter.upsert({
        where: { parameter },
        update: { value },
        create: { parameter, value }
      })
      results.push(up)
    }
    res.json(results)
  } catch (err) {
    next(err)
  }
})

export default router
