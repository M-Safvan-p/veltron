const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
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
        variantId: {
          type: String,
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        finalProductPrice: { type: Number, required: true },
        vendorEarning: { type: Number, required: true },
        commissionAmount: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true },
        subTotal: { type: Number, required: true },
        tax: { type: Number, required: true },
        discount: { type: Number },
      },
    ],
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    refundStatus: {
      type: String,
      enum: ["pending", "processed", "failed", "completed"],
      default: "pending",
    },
    refundAmount: {
      type: Number,
      required: false,
    },
    refundMethod: {
      type: String,
      required: false,
    },
    refundDate: {
      type: Date,
      required: false,
    },
    returnDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

module.exports = mongoose.model("Return", returnSchema);
