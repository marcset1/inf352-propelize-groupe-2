import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../middleware/logger.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '60m' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const existingUser = await User.findOne({ where: { name } });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const user = await User.create({
      name,
      password,
      role: 'user'
    });

    const { accessToken, refreshToken } = generateTokens(user);
    
    await User.update({ refreshToken }, { where: { id: user.id } });
    
    logger.info(`User registered: ${name}`);
    return res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({ 
      error: "Registration failed",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

export const login = async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const user = await User.findOne({ where: { name } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    await User.update({ refreshToken }, { where: { id: user.id } });
    
    logger.info(`User logged in: ${name}`);
    return res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ 
      error: "Login failed",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token is required" });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // Mettre à jour le refresh token
    await User.update({ refreshToken: newRefreshToken }, { where: { id: user.id } });
    
    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error('Refresh token error:', error);
    return res.status(403).json({ error: "Invalid token" });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    await User.update({ refreshToken: null }, { where: { id: decoded.id } });
    
    return res.status(204).send();
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};