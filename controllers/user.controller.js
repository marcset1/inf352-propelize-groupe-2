//controller/user.controller.js
import User from '../models/user.model.js';
import logger from '../middleware/logger.js';
import bcrypt from 'bcrypt';

// Admin-only user creation
export const createUser = async (req, res) => {
  try {
    const { name, password, role = 'user' } = req.body;

    // Validation
    if (!name || !password) {
      return res.status(400).json({ 
        error: "Name and password are required" 
      });
    }

    // Check if user already exists (by name)
    const existingUser = await User.findOne({ where: { name } });
    if (existingUser) {
      return res.status(409).json({ error: "Username already in use" });
    }

    // Create user
    const user = await User.create({
      name,
      password, // Will be hashed by the model hook
      role
    });

    // Return user data without sensitive information
    const userResponse = {
      id: user.id,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    };

    logger.info(`User created by admin: ${user.name}`);
    return res.status(201).json(userResponse);
  } catch (error) {
    logger.error('Create user error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: "Validation error",
        details: error.errors.map(e => e.message) 
      });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    // Only admins can list all users (enforced by route middleware)
    const users = await User.findAll({
      attributes: ['id', 'name', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    // Users can get their own profile, admins can get any profile
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'role', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Non-admin users can only access their own profile
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    return res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, role } = req.body;

    // Find the user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Non-admin users can only update their own profile
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Admins can't demote themselves
    if (req.user.id === user.id && role && role !== req.user.role) {
      return res.status(403).json({ error: "Cannot change your own role" });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role && req.user.role === 'admin') updateData.role = role;

    // Only proceed if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await User.update(updateData, { where: { id } });

    // Get updated user (without sensitive data)
    const updatedUser = await User.findByPk(id, {
      attributes: ['id', 'name', 'role', 'createdAt']
    });

    logger.info(`User updated: ${updatedUser.name}`);
    return res.json(updatedUser);
  } catch (error) {
    logger.error('Update user error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: "Username already in use" });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the user
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Prevent users from deleting themselves
      if (req.user.id === user.id) {
        return res.status(403).json({ error: "Cannot delete your own account" });
      }
  
      await User.destroy({ where: { id } });
  
      logger.info(`User deleted: ${user.name}`);
      return res.status(200).json({ 
        message: `${user.name} has been successfully deleted` 
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'role', 'createdAt']
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.json(user);
  } catch (error) {
    logger.error('Get current user error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};