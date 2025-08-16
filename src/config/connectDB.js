const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/userLog');
    console.log(' Connected to MongoDB');
  } catch (err) {
    console.error(' Connection error:', err);
  }
};

module.exports = connectDB;