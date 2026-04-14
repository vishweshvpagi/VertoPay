const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/database");

dotenv.config();

const app = express();

// ── NUCLEAR CORS — set headers on EVERY response manually ────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  // ✅ Kill preflight here — never reaches auth middleware
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(
    `📨 ${req.method} ${req.path} [${new Date().toLocaleTimeString("en-IN")}]`,
  );
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/students", require("./src/routes/studentRoutes"));
app.use("/api/merchants", require("./src/routes/merchantRoutes"));
app.use("/api/transactions", require("./src/routes/transactionRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));

// ── Health / root ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ name: "VertoPay API", version: "1.0.0", status: "running" }),
);
app.get("/api/health", (_req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() }),
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ message: `Cannot ${req.method} ${req.path}` }),
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("❌ Unhandled error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 0;

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`\n🚀 VertoPay API running on http://localhost:${PORT}`);
        console.log(`🌐 Network:  http://192.168.0.101:${PORT}`);
        console.log(`❤️  Health:  http://localhost:${PORT}/api/health\n`);
      });
    })
    .catch((err) => {
      console.error("❌ DB connection failed:", err);
      process.exit(1);
    });
}

process.on("SIGINT", () => {
  console.log("\n⚠️  Shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
