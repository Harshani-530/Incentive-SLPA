import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateUsername, checkUsernameExists } from '../utils/usernameValidator.js';
import { validatePassword, savePasswordToHistory } from '../utils/passwordValidator.js';
import { validateName, formatNameToProperCase } from '../utils/nameValidator.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to authenticate Super Admin
const authenticateSuperAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to authenticate Admin
const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'Admin' && decoded.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all users (Super Admin only)
router.get('/', authenticateSuperAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create Admin user (Super Admin only)
router.post('/create-admin', authenticateSuperAdmin, async (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Validate username
    const usernameValidation = validateUsername(username, password);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.error });
    }

    // Validate password
    const passwordValidation = validatePassword(password, username);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.errors.join('. ') });
    }

    if (name && name.length > 30) {
      return res.status(400).json({ error: 'Name cannot exceed 30 characters' });
    }

    // Validate name if provided
    if (name && name.trim()) {
      const nameValidation = validateName(name.trim());
      if (!nameValidation.valid) {
        return res.status(400).json({ error: nameValidation.error });
      }
    }

    // Check if username already exists (case-insensitive)
    const usernameExists = await checkUsernameExists(prisma, username);
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Format name to proper case
    const formattedName = name && name.trim() ? formatNameToProperCase(name.trim()) : null;

    // Create Admin user
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: formattedName,
        role: 'Admin',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: 'Admin user created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating admin user:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Toggle user active status (Super Admin only)
router.patch('/:id/toggle-active', authenticateSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent Super Admin from deactivating themselves
    if (user.role === 'Super Admin') {
      return res.status(403).json({ error: 'Cannot modify Super Admin account' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({ message: 'User status updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset user password (Super Admin only)
router.patch('/:id/reset-password', authenticateSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent Super Admin password reset through this endpoint
    if (user.role === 'Super Admin') {
      return res.status(403).json({ error: 'Cannot reset Super Admin password through this endpoint' });
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword, user.username);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.errors.join('. ') });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user (Super Admin only)
router.delete('/:id', authenticateSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent Super Admin from being deleted
    if (user.role === 'Super Admin') {
      return res.status(403).json({ error: 'Cannot delete Super Admin account' });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ===== ADMIN ENDPOINTS FOR OPERATOR MANAGEMENT =====

// Get all operators (Admin only)
router.get('/operators', authenticateAdmin, async (req, res) => {
  try {
    const operators = await prisma.user.findMany({
      where: { role: 'Operator' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
});

// Create Operator user (Admin only)
router.post('/create-operator', authenticateAdmin, async (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Validate username
    const usernameValidation = validateUsername(username, password);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.error });
    }

    // Validate password
    const passwordValidation = validatePassword(password, username);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.errors.join('. ') });
    }

    if (name && name.length > 30) {
      return res.status(400).json({ error: 'Name cannot exceed 30 characters' });
    }

    // Validate name if provided
    if (name && name.trim()) {
      const nameValidation = validateName(name.trim());
      if (!nameValidation.valid) {
        return res.status(400).json({ error: nameValidation.error });
      }
    }

    // Check if username already exists (case-insensitive)
    const usernameExists = await checkUsernameExists(prisma, username);
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Format name to proper case
    const formattedName = name && name.trim() ? formatNameToProperCase(name.trim()) : null;

    // Create Operator user
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: formattedName,
        role: 'Operator',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: 'Operator user created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating operator user:', error);
    res.status(500).json({ error: 'Failed to create operator user' });
  }
});

// Toggle operator active status (Admin only)
router.patch('/operators/:id/toggle-active', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'Operator') {
      return res.status(403).json({ error: 'Can only modify Operator accounts' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({ message: 'Operator status updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error toggling operator status:', error);
    res.status(500).json({ error: 'Failed to update operator status' });
  }
});

// Reset operator password (Admin only)
router.patch('/operators/:id/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'Operator') {
      return res.status(403).json({ error: 'Can only reset Operator passwords' });
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword, user.username);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.errors.join('. ') });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete operator (Admin only)
router.delete('/operators/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'Operator') {
      return res.status(403).json({ error: 'Can only delete Operator accounts' });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    res.status(500).json({ error: 'Failed to delete operator' });
  }
});

export default router;
