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
    console.log('>>> [DEBUG register] req.body =', req.body);
    const { name, password } = req.body;
    
    if (!name || !password) {
      console.log('    [DEBUG register] Missing name or password');
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const existingUser = await User.findOne({ where: { name } });
    if (existingUser) {
      console.log('    [DEBUG register] Username already exists:', name);
      return res.status(409).json({ error: "Username already exists" });
    }

    // Essayer de créer l’utilisateur
    const user = await User.create({
      name,
      password,
      role: 'user'
    });
    console.log('    [DEBUG register] User created with id =', user.id);

    const { accessToken, refreshToken } = generateTokens(user);
    
    await User.update({ refreshToken }, { where: { id: user.id } });
    console.log('    [DEBUG register] Refresh token stored');

    logger.info(`User registered: ${name}`);
    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    // Afficher la stack complète dans la console Node
    console.error('❌ [DEBUG register] Error stack:', error.stack);
    logger.error('Registration error:', error);
    return res.status(500).json({ 
      error: "Registration failed",
      // En mode développement, renvoyer le détail
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

export const login = async (req, res) => {
  try {
    console.log('>>> [DEBUG login] req.body =', req.body);
    const { name, password } = req.body;
    
    if (!name || !password) {
      console.log('    [DEBUG login] Missing credentials');
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const user = await User.findOne({ where: { name } });
    if (!user) {
      console.log('    [DEBUG login] User not found:', name);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('    [DEBUG login] Password mismatch for:', name);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    await User.update({ refreshToken }, { where: { id: user.id } });
    console.log('    [DEBUG login] Refresh token updated for:', name);
    
    logger.info(`User logged in: ${name}`);
    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG login] Error stack:', error.stack);
    logger.error('Login error:', error);
    return res.status(500).json({ 
      error: "Login failed",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    console.log('>>> [DEBUG refreshToken] req.body =', req.body);
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      console.log('    [DEBUG refreshToken] No token provided');
      return res.status(401).json({ error: "Refresh token is required" });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      console.log('    [DEBUG refreshToken] Invalid refresh token for user id:', decoded.id);
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    await User.update({ refreshToken: newRefreshToken }, { where: { id: user.id } });
    console.log('    [DEBUG refreshToken] Refresh token rotated for user id:', user.id);
    
    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('❌ [DEBUG refreshToken] Error stack:', error.stack);
    logger.error('Refresh token error:', error);
    return res.status(403).json({ error: "Invalid token" });
  }
};

export const logout = async (req, res) => {
  try {
    console.log('>>> [DEBUG logout] req.body =', req.body);
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      console.log('    [DEBUG logout] No token provided');
      return res.status(400).json({ error: "Refresh token is required" });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    await User.update({ refreshToken: null }, { where: { id: decoded.id } });
    console.log('    [DEBUG logout] Refresh token cleared for user id:', decoded.id);
    
    return res.status(204).send();
  } catch (error) {
    console.error('❌ [DEBUG logout] Error stack:', error.stack);
    logger.error('Logout error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

