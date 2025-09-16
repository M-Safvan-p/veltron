const mongoose = require("mongoose");
const User = require("../src/models/user/userSchema");
const UserWallet = require("../src/models/user/userWalletSchema");
const Vendor = require("../src/models/vendor/vendorSchema");
const VendorWallet = require("../src/models/vendor/vendorWalletSchema");

const MONGO_URI = "mongodb://127.0.0.1:27017/veltron";

async function backfillUserWallets() {
  const users = await User.find({ wallet: { $exists: false } }); // or { wallet: null }
  console.log(`Found ${users.length} users without wallet`);

  for (const user of users) {
    const newWallet = new UserWallet({
      userId: user._id,
      balance: 0,
      transactionHistory: [],
    });
    await newWallet.save();

    user.wallet = newWallet._id;
    await user.save();
    console.log(`✅ Wallet created for user: ${user.email}`);
  }
}

async function backfillVendorWallets() {
  const vendors = await Vendor.find({ wallet: { $exists: false } }); // or { wallet: null }
  console.log(`Found ${vendors.length} vendors without wallet`);

  for (const vendor of vendors) {
    const newWallet = new VendorWallet({
      vendorId: vendor._id,
      balance: 0,
      transactionHistory: [],
    });
    await newWallet.save();

    vendor.wallet = newWallet._id;
    await vendor.save();
    console.log(`✅ Wallet created for vendor: ${vendor.brandEmail}`);
  }
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB");

    await backfillUserWallets();
    await backfillVendorWallets();

    console.log("🎉 Migration complete");
    mongoose.disconnect();
  } catch (err) {
    console.error("Migration failed:", err);
    mongoose.disconnect();
  }
}

run();
