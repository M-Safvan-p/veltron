const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String, required: true },
        quantity: {
          type: Number,
          default: 1,
          required: true,
          min: 1,
        },
        price: { type: Number, required: true },
        discountedPrice: { type: Number, required: true },
        image: { type: String, required: true },
        selectedColor: { type: String, required: false },
        variantId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
