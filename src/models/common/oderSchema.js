const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed", "completed"],
      default: "pending",
      required: true,
    },
    paymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    couponDetails: {
      code: { type: String },
      discount: { type: Number },
      discountType: { type: String },
      maxDiscount: { type: Number },
      minPurchase: { type: Number },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    totalCommissionAmount: {
      type: Number,
      required: true,
    },
    totalVendorEarnings: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      fullAddress: { type: String, required: true },
      landmark: { type: String },
      district: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: Number, required: true },
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        vendorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vendor",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        selectedColor: { type: String },
        priceAtPurchase: { type: Number, required: true },
        productTotal: { type: Number, required: true },
        commissionAmount: { type: Number, required: true },
        vendorEarning: { type: Number, required: true },
      },
    ],
    invoiceDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
