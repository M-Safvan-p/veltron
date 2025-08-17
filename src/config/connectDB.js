const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(' Connected to MongoDB');
  } catch (err) {
    console.error(' Connection error:', err);
  }
};

module.exports = connectDB;