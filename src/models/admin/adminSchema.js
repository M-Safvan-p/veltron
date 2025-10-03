const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminSchema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
  },
});

module.exports = mongoose.model("Admin", adminSchema);
