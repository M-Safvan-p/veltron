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
    orderStatus: {
      type: String,
      enum: ["pending","processing", "shipped", "completed", "cancelled", "failed"],
      default: "processing",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "WALLET", "RAZORPAY"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      required: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
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
      email: { type: String, required: true },
      phone: { type: String, required: true },
      fullAddress: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: Number, required: true },
      type: { type: String, enum: ["Home", "Work", "Other"] },
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
        orderStatus: {
          type: String,
          enum: ["processing", "shipped", "cancelled", "completed"],
          default: "processing",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        selectedColor: { type: String, required: true },
        priceAtPurchase: { type: Number, required: true },
        productTotal: { type: Number, required: true },
        commissionAmount: { type: Number, required: true },
        vendorEarning: { type: Number, required: true },
        variantId: { type: String, required: true },
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
