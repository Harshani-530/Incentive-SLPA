import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../server.js'

const router = express.Router()

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// POST /api/auth/login
// Body: { username, password }
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is inactive' })
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000)
      return res.status(401).json({ 
        error: `Account is locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        isLocked: true,
        lockedUntil: user.lockedUntil
      })
    }

    // If lock has expired, reset failed attempts
    if (user.lockedUntil && new Date() >= new Date(user.lockedUntil)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1
      const maxAttempts = 5
      const lockDuration = 15 * 60 * 1000 // 15 minutes

      if (newFailedAttempts >= maxAttempts) {
        // Lock account
        const lockedUntil = new Date(Date.now() + lockDuration)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockedUntil: lockedUntil
          }
        })
        return res.status(401).json({ 
          error: `Account locked due to ${maxAttempts} failed login attempts. Please try again in 15 minutes.`,
          isLocked: true,
          lockedUntil: lockedUntil
        })
      } else {
        // Update failed attempts
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts
          }
        })
        const attemptsLeft = maxAttempts - newFailedAttempts
        return res.status(401).json({ 
          error: `Invalid username or password. ${attemptsLeft} attempt(s) remaining.`,
          attemptsLeft: attemptsLeft
        })
      }
    }

    // Successful login - reset failed attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/verify
// Verify if token is valid
router.post('/verify', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
