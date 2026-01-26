const express = require('express');
const router = express.Router();
const {
  registerStudent,
  registerMerchant,
  registerAdmin,
  login,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register/student', registerStudent);
router.post('/register/merchant', registerMerchant);
router.post('/register/admin', registerAdmin);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
