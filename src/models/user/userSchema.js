const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    profileImage: {
      type: String,
      default: "https://res.cloudinary.com/ddj9jtbof/image/upload/c_thumb,g_face,r_max,w_200,h_200/v1757400110/avatar_aogxki.jpg",
    },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    referralCode: { type: String, unique: true, sparse: true, required: true },
    referredUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    googleId: { type: String, unique: true, sparse: true },
    wallet: { type: Schema.Types.ObjectId, ref: "UserWallet" },
    authProvider: { type: String, enum: ["local", "google"], required: true },
    searchHistory: [
      {
        category: { type: Schema.Types.ObjectId, ref: "Category" },
        vendor: { type: String },
        searchOn: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
