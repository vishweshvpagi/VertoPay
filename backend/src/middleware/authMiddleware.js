const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Merchant = require('../models/Merchant');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user based on role
      if (decoded.role === 'student') {
        req.user = await Student.findById(decoded.id).select('-password -privateKey');
      } else if (decoded.role === 'merchant') {
        req.user = await Merchant.findById(decoded.id).select('-password');
      } else if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access only' });
  }
};

const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Student access only' });
  }
};

const merchantOnly = (req, res, next) => {
  if (req.user && req.user.role === 'merchant') {
    next();
  } else {
    res.status(403).json({ message: 'Merchant access only' });
  }
};

module.exports = { protect, adminOnly, studentOnly, merchantOnly };
