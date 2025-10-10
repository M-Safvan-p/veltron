const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    discount: { type: Number, required: true, min: 0, max: 100 },
    minPurchase: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date, required: true },
    maxUsage: { type: Number, default: 1, min: 1 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
