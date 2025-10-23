const mongoose = require("mongoose");
const User = require("../src/models/user/userSchema");
const UserWallet = require("../src/models/user/userWalletSchema");

mongoose
  .connect("mongodb://localhost:27017/veltron")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

const generateReferralCode = (name) => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return name ? name.slice(0, 5).toUpperCase() + random : "USER" + random;
};

(async () => {
  try {
    // 1. Generate referral codes
    const usersWithoutCode = await User.find({
      $or: [{ referralCode: { $exists: false } }, { referralCode: null }, { referralCode: "" }],
    });

    console.log(`Found ${usersWithoutCode.length} users without referral codes`);

    for (const user of usersWithoutCode) {
      const code = generateReferralCode(user.fullName || "USER");
      console.log(`Generated Code for ${user.fullName || user._id}: ${code}`);
      user.referralCode = code;
      await user.save();
    }

    console.log("✓ Referral codes generated\n");

    // 2. Backfill wallets
    const usersWithoutWallet = await User.find({
      $or: [{ wallet: { $exists: false } }, { wallet: null }],
    });

    console.log(`Found ${usersWithoutWallet.length} users without wallet reference\n`);

    let created = 0;
    let linked = 0;
    let skipped = 0;

    for (const user of usersWithoutWallet) {
      try {
        // Check if wallet already exists for this user
        const existingWallet = await UserWallet.findOne({ userId: user._id });

        if (existingWallet) {
          // Wallet exists but user doesn't have reference
          user.wallet = existingWallet._id;
          await user.save();
          console.log(`✓ Linked existing wallet for user ${user._id}`);
          linked++;
        } else {
          // Create new wallet
          const newWallet = new UserWallet({
            userId: user._id,
            balance: 0,
            transactions: [],
          });
          await newWallet.save();

          user.wallet = newWallet._id;
          await user.save();

          console.log(`✓ Created new wallet for user ${user._id}`);
          created++;
        }
      } catch (err) {
        if (err.code === 11000) {
          console.log(`⚠ Duplicate error for user ${user._id}, skipping`);
          skipped++;
        } else {
          console.error(`✗ Error for user ${user._id}:`, err.message);
        }
      }
    }

    console.log("\n--- Migration Summary ---");
    console.log(`Referral codes generated: ${usersWithoutCode.length}`);
    console.log(`New wallets created: ${created}`);
    console.log(`Existing wallets linked: ${linked}`);
    console.log(`Skipped (errors): ${skipped}`);
    console.log("\n✓ Migration completed");

    mongoose.connection.close();
  } catch (err) {
    console.error("Migration failed:", err);
    mongoose.connection.close();
  }
})();
