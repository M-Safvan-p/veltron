const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    discountType: { type: String, required: true },
    maxDiscount: { type: Number, default: 0 },
    minPurchase: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    maxUsage: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
