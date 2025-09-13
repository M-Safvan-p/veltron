const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
    },
    referrerReward: {
      type: Number,
      default: 0,
    },
    referredReward: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "credited", "rejected"],
      default: "pending",
    },
    creditedAt: {
      type: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } } );

module.exports = mongoose.model("Referral", referralSchema);
