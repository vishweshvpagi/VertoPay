const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Generates unique IDs like STU_A3F9B2, MER_C1D4E8
const generateId = (prefix = "ID") => {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}_${rand}`;
};

module.exports = { generateToken, generateId };
