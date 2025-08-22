const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  brandName: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  brandEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String, 
    required: true,
    unique: true,
  },
  permissionStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  commissionRate: {
    type: Number,
    default: 0.10, 
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"Wallet"
  }
}, { timestamps: true }); 

module.exports = mongoose.model("Vendor", vendorSchema);
