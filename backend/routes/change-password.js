import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../server.js'
import { validatePassword, isPasswordReused, savePasswordToHistory } from '../utils/passwordValidator.js'

const router = express.Router()

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
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

// POST /api/change-password
// Body: { currentPassword, newPassword }
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword, req.user.username)
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.errors.join('. ') })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Check if password was used before
    const isReused = await isPasswordReused(prisma, user.id, newPassword)
    if (isReused) {
      return res.status(400).json({ error: 'Password was used previously. Please choose a different password.' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Save to password history
    await savePasswordToHistory(prisma, user.id, hashedPassword)

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (err) {
    next(err)
  }
})

export default router
