import express from 'express';
import { manualCleanup } from '../scheduler.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to authenticate Super Admin
const authenticateSuperAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Manual cleanup endpoint for testing (Super Admin only)
router.post('/manual-cleanup', authenticateSuperAdmin, async (req, res) => {
  try {
    const result = await manualCleanup();
    res.json({
      message: 'Manual cleanup completed successfully',
      ...result
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ error: 'Failed to perform manual cleanup' });
  }
});

export default router;
