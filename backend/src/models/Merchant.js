const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const merchantSchema = new mongoose.Schema({
  merchantId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['canteen', 'bookstore', 'stationery', 'laundry', 'other'],
    default: 'other'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    default: 'merchant'
  }
}, {
  timestamps: true
});

// Hash password before saving
merchantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
merchantSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive data
merchantSchema.methods.toJSON = function() {
  const merchant = this.toObject();
  delete merchant.password;
  return merchant;
};

module.exports = mongoose.model('Merchant', merchantSchema);
