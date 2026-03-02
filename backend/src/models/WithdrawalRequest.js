const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    amount: { type: Number, required: true, min: 100 },
    upiId: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: { type: String, default: "" },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

withdrawalRequestSchema.index({ merchant: 1, status: 1 });
module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
