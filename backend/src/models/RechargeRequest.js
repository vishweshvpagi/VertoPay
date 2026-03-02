const mongoose = require("mongoose");

const rechargeRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    note: { type: String, default: "" },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

rechargeRequestSchema.index({ student: 1, status: 1 });
module.exports = mongoose.model("RechargeRequest", rechargeRequestSchema);
