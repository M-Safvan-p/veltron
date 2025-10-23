const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const Wallet = require("../../models/user/userWalletSchema");

const crypto = require("crypto");
const razorpay = require("../../config/razorpayConfig");
const { RAZORPAY_KEY_SECRET, RAZORPAY_KEY_ID } = require("../../config/env");

const loadWallet = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    let skip = (page - 1) * limit;
    const userId = req.session.user;
    const wallet = await Wallet.findOne({ userId }).lean();
    const paginatedTransactions = [...wallet.transactionHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(skip, skip + limit);

    const totalTransactions = wallet.transactionHistory.length;
    res.render("user/wallet", {
      user: req.user,
      wallet,
      currentPage: "wallet",
      layout: "layouts/userLayout",
      page,
      transactions: paginatedTransactions,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
    });
  } catch (error) {
    console.log("load wallet error", error);
    return res.redirect("/profile/");
  }
};

const createWalletOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_AMOUNT);
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `wallet_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      key: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Create Wallet Order Error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const verifyWalletPayment = async (req, res) => {
  try {
    const userId = req.session.user;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PAYMENT_VERIFIED_FAILED);
    }

    let wallet = await Wallet.findOne({ userId });

    const amountInRupees = Number(amount);
    const transaction = {
      type: "credit",
      amount: amountInRupees,
      message: "Added to wallet via Razorpay",
      date: new Date(),
    };

    if (wallet) {
      wallet.balance += amountInRupees;
      wallet.transactionHistory.push(transaction);
      await wallet.save();
    } else {
      wallet = new Wallet({
        userId,
        balance: amountInRupees,
        transactionHistory: [transaction],
      });
      await wallet.save();
    }

    return success(res, HttpStatus.OK, Messages.PAYMENT_VERIFIED_SUCCESS, { balance: wallet.balance });
  } catch (error) {
    console.error("Verify Wallet Payment Error:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadWallet,
  createWalletOrder,
  verifyWalletPayment,
};
