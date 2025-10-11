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
      enum: ["Available", "out-of-stock", "Discontinued"],
      default: "Available",
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    offer: {
      type: Number, 
      default: 0,
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
        images: [
          {
            url: { type: String, required: true },
            public_id: { type: String, required: true },
            filename: { type: String },
          },
        ],
      },
    ],
    specifications: {
      strapStyle: { type: String, required: true },
      weight: { type: String },
      dialType: { type: String },
      additionalInformation: { type: String },
      warrantyPeriod: { type: String },
      durability: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
