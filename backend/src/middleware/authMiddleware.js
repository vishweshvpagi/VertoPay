const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Merchant = require("../models/Merchant");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {
  if (req.method === "OPTIONS") return next(); // ✅ preflight bypass

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;
    if (decoded.role === "student")
      user = await Student.findById(decoded.id).select("-password -privateKey");
    if (decoded.role === "merchant")
      user = await Merchant.findById(decoded.id).select("-password");
    if (decoded.role === "admin")
      user = await Admin.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.isActive === false) {
      return res
        .status(403)
        .json({ message: "Account is deactivated. Contact admin." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    }
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.method === "OPTIONS") return next(); // ✅ preflight bypass
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Admin access only" });
};

const studentOnly = (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (req.user?.role === "student") return next();
  return res.status(403).json({ message: "Student access only" });
};

const merchantOnly = (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (req.user?.role === "merchant") return next();
  return res.status(403).json({ message: "Merchant access only" });
};

module.exports = { protect, adminOnly, studentOnly, merchantOnly };
