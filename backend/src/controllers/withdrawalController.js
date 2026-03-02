const crypto = require("crypto");
const Merchant = require("../models/Merchant");
const WithdrawalRequest = require("../models/WithdrawalRequest");

// ── POST /api/merchants/withdraw ──────────────────────────────────────────────
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, upiId, note } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount < 100) {
      return res.status(400).json({ message: "Minimum withdrawal is ₹100" });
    }
    if (!upiId?.trim()) {
      return res.status(400).json({ message: "UPI ID is required" });
    }

    const merchant = await Merchant.findById(req.user._id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }
    if (merchant.balance < parsedAmount) {
      return res.status(400).json({
        message: `Insufficient balance. Your balance is ₹${merchant.balance.toFixed(2)}`,
      });
    }

    // Block duplicate pending request
    const existing = await WithdrawalRequest.findOne({
      merchant: req.user._id,
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({
        message:
          "You already have a pending withdrawal request. Wait for admin approval.",
      });
    }

    const request = await WithdrawalRequest.create({
      requestId: `WDL_${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      merchant: req.user._id,
      amount: parsedAmount,
      upiId: upiId.trim(),
      note: note?.trim() || "",
    });

    console.log(
      `📤 Withdrawal request: ₹${parsedAmount} by ${merchant.shopName} → UPI: ${upiId}`,
    );

    res.status(201).json({
      message: "Withdrawal request submitted. Awaiting admin approval.",
      request,
    });
  } catch (error) {
    console.error("Request withdrawal error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/merchants/withdraw/history ───────────────────────────────────────
const getMyRequests = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({ merchant: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ requests });
  } catch (error) {
    console.error("Get my requests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/withdrawals ────────────────────────────────────────────────
const getAllWithdrawals = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const requests = await WithdrawalRequest.find({ status })
      .populate("merchant", "shopName merchantId email balance phone")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    console.error("Get all withdrawals error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/admin/withdrawals/:requestId/approve ────────────────────────────
const approveWithdrawal = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findOne({
      requestId: req.params.requestId,
    });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Request is already ${request.status}` });
    }

    // Debit merchant balance
    const merchant = await Merchant.findByIdAndUpdate(
      request.merchant,
      { $inc: { balance: -request.amount } },
      { new: true },
    );
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    // Guard against negative balance race condition
    if (merchant.balance < 0) {
      await Merchant.findByIdAndUpdate(request.merchant, {
        $inc: { balance: request.amount },
      });
      return res
        .status(400)
        .json({ message: "Merchant has insufficient balance" });
    }

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    console.log(
      `✅ Withdrawal approved: ₹${request.amount} | ${merchant.shopName} → UPI: ${request.upiId}`,
    );

    res.json({
      message:
        "Withdrawal approved. Transfer the amount to the UPI ID provided.",
      request,
      merchantBalance: merchant.balance,
    });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/admin/withdrawals/:requestId/reject ─────────────────────────────
const rejectWithdrawal = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findOne({
      requestId: req.params.requestId,
    });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Request is already ${request.status}` });
    }

    request.status = "rejected";
    request.adminNote = req.body.note?.trim() || "Rejected by admin";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    console.log(
      `❌ Withdrawal rejected: ₹${request.amount} | RequestId: ${request.requestId}`,
    );

    res.json({ message: "Withdrawal request rejected", request });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/withdrawals/export ─────────────────────────────────────────
const exportWithdrawalsCSV = async (req, res) => {
  try {
    const { from, to, status = "approved" } = req.query;

    const filter = { status };

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const requests = await WithdrawalRequest.find(filter)
      .populate("merchant", "shopName merchantId email phone")
      .sort({ createdAt: 1 }); // oldest first for settlement sheet

    if (requests.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found for the selected filters" });
    }

    // ── Build CSV ─────────────────────────────────────────────────────────────
    const header = [
      "S.No",
      "Request ID",
      "Requested Date",
      "Shop Name",
      "Merchant ID",
      "Email",
      "Phone",
      "UPI ID",
      "Amount (INR)",
      "Status",
      "Approved/Rejected On",
      "Merchant Note",
    ].join(",");

    const rows = requests.map((r, i) => {
      const cols = [
        i + 1,
        r.requestId,
        new Date(r.createdAt).toLocaleDateString("en-IN"),
        `"${(r.merchant?.shopName || "").replace(/"/g, "'")}"`,
        r.merchant?.merchantId || "",
        r.merchant?.email || "",
        r.merchant?.phone || "",
        r.upiId,
        r.amount.toFixed(2),
        r.status.toUpperCase(),
        r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString("en-IN") : "",
        `"${(r.note || "").replace(/"/g, "'")}"`,
      ];
      return cols.join(",");
    });

    // Summary row at bottom
    const totalAmount = requests.reduce((sum, r) => sum + r.amount, 0);
    const summaryRow = [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "TOTAL",
      totalAmount.toFixed(2),
      "",
      "",
      "",
    ].join(",");

    const csv = [header, ...rows, "", summaryRow].join("\n");

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `vertopay_withdrawals_${status}_${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv); // ✅ BOM prefix — makes Excel open UTF-8 correctly

    console.log(
      `📤 CSV exported: ${requests.length} records | ₹${totalAmount} | Status: ${status}`,
    );
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestWithdrawal,
  getMyRequests,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  exportWithdrawalsCSV,
};
