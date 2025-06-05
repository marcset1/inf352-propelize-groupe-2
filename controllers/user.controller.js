import User from '../models/user.model.js';
import logger from '../middleware/logger.js';

// Création d’un utilisateur (admin uniquement)
export const createUser = async (req, res) => {
  try {
    const { name, password, role = 'user' } = req.body;

    // Validation basique
    if (!name || !password) {
      return res.status(400).json({ error: "Name and password are required" });
    }

    // Vérifier si l’utilisateur existe déjà
    const existingUser = await User.findOne({ where: { name } });
    if (existingUser) {
      return res.status(409).json({ error: "Username already in use" });
    }

    // Création de l’utilisateur (le mot de passe sera hashé via hook)
    const user = await User.create({ name, password, role });

    // Réponse sans données sensibles
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

// Récupérer tous les utilisateurs (admin uniquement)
export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refreshToken'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      error: 'Server error while fetching users',
      details: error.message
    });
  }
};

// Récupérer un utilisateur par ID (admin ou utilisateur lui-même)
export const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'role', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    return res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Mettre à jour un utilisateur (admin ou utilisateur lui-même)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Interdire aux non-admins de changer le rôle
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You cannot change your role.' });
    }

    // Contrôle d’accès
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Empêcher un admin de se dégrader lui-même
    if (req.user.id === user.id && role && role !== req.user.role) {
      return res.status(403).json({ error: "Cannot change your own role" });
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    if (name) updateData.name = name;
    if (password) updateData.password = password;
    if (role && req.user.role === 'admin') updateData.role = role;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Mise à jour avec déclenchement des hooks (ex: hash password)
    await User.update(updateData, { where: { id }, individualHooks: true });

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

// Supprimer un utilisateur (admin uniquement, sauf soi-même)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.id === user.id) {
      return res.status(403).json({ error: "Cannot delete your own account" });
    }

    await User.destroy({ where: { id } });

    logger.info(`User deleted: ${user.name}`);
    return res.status(200).json({ message: `${user.name} has been successfully deleted` });
  } catch (error) {
    logger.error('Delete user error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Récupérer le profil de l’utilisateur connecté
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

