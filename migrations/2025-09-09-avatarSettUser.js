const mongoose = require("mongoose");
const User = require("../src/models/user/userSchema"); // adjust path to your User model

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/ddj9jtbof/image/upload/c_thumb,g_face,r_max,w_200,h_200/v1757400110/avatar_aogxki.jpg";

async function migrateUsers() {
  try {
    await mongoose.connect("mongodb://localhost:27017/veltron");

    const result = await User.updateMany(
      {}, // match all users
      { $set: { profileImage: DEFAULT_AVATAR } }
    );

    console.log(`✅ Migration complete. Updated ${result.modifiedCount} users.`);
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}

migrateUsers();
