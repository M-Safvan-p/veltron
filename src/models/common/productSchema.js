const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    productStatus: {
        type: String,
        enum: ["Available","out-of-stock", "Discountinued"],
        default: "Available",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    discountedPrice: {
      type: Number,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    variants: [
      {
        color: { type: String, required: true },
        stock: { type: Number, default: 0 },
        images: [{ type: String, required: true }],
      },
    ],
    specification: [
      {
        StrapStyle: { type: String, required: true },
        Weight: { type: String, required: true },
        DialType: { type: String, required: true },
        AdditionalInformation: { type: String, required: true },
        warrantyPeriod: { type: String, required: true },
        Durability: { type: String, required: true },
      },
      
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
