const mongoose = require("mongoose");

const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const Wallet = require("../../models/user/userWalletSchema");

const loadWallet = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 10; 
    let skip = (page - 1) * limit;
    const userId = req.session.user;
    const wallet = await Wallet.findOne({ userId }).lean();
    const paginatedTransactions = wallet.transactionHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(skip, skip + limit);
    console.log("wallet", wallet);
    const totalTransactions = wallet.transactionHistory.length;
    res.render("user/wallet", {
      user: req.user,
      wallet,
      currentPage: "wallet",
      layout: "layouts/userLayout",
      page,
      transactions:paginatedTransactions,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
    });
  } catch (error) {
    console.log("load wallet error", error);
    return res.redirect("/profile/");
  }
};

const addMoney = async (req, res) => {
  try {
    const userId = req.session.user;
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_AMOUNT);

    const wallet = await Wallet.findOne({ userId });
    if (wallet) {
      wallet.balance += amount;
      wallet.transactionHistory.push({
        amount,
        type: "credit",
        message: "Amount added into wallet",
      });
      await wallet.save();
    } else {
      const newWallet = new Wallet({
        userId,
        balance: amount,
        transactionHistory: [
          {
            amount,
            type: "credit",
            message: "Amount added into wallet",
          },
        ],
      });
      await newWallet.save();
    }

    return success(res, HttpStatus.OK);
  } catch (error) {
    console.log("add money to wallet error", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadWallet,
  addMoney,
};
