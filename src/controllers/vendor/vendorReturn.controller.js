const Return = require("../../models/common/returnSchema");
const Wallet = require("../../models/user/userWalletSchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const loadReturns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const sort = req.query.sort || "newest";
    const filterStatus = req.query.status || "";
    const search = req.query.search || "";

    let query = {
      "items.vendorId": req.session.vendor,
    };

    if (filterStatus) {
      query.status = filterStatus;
    }

    if (search) {
      query.orderId = { $regex: search, $options: "i" };
    }

    let sortOption = {};
    switch (sort) {
      case "oldest":
        sortOption = { returnDate: 1 };
        break;
      case "newest":
      default:
        sortOption = { returnDate: -1 };
    }

    const returns = await Return.find(query)
      .populate({
        path: "orderId",
        select: "shippingAddress orderDate totalAmount orderId",
      })
      .populate({
        path: "userId",
        select: "fullName email phone",
      })
      .populate({
        path: "items.productId",
        select: "name variants",
      })
      .sort(sortOption)
      .limit(limit)
      .skip(skip)
      .lean();

    const totalReturns = await Return.countDocuments(query);
    const totalPages = Math.ceil(totalReturns / limit);

    const pendingCount = await Return.countDocuments({
      ...query,
      status: "pending",
    });

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const monthlyCount = await Return.countDocuments({
      ...query,
      returnDate: { $gte: firstDayOfMonth },
    });

    res.render("vendor/returns", {
      layout: "layouts/vendorLayout",
      vendor: req.vendor,
      returns: returns || [],
      currentPage: page,
      totalPages: totalPages,
      totalReturns: totalReturns,
      limit: limit,
      sort: sort,
      status: filterStatus,
      search: search,
      pendingCount: pendingCount,
      monthlyCount: monthlyCount,
      activePage: "returns",
    });
  } catch (error) {
    console.error("Error loading returns:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};
const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find the return
    const returnItem = await Return.findById(id);
    if (!returnItem) {
      return errorResponse(res, HttpStatus.NOT_FOUND, "Return not found");
    }
    // Update status
    returnItem.status = status;
    if (status === "approved") {
      returnItem.refundStatus = "processed";
    }
    if (status === "completed") {
      returnItem.refundStatus = "completed";
      // refund
      const userWallet = await Wallet.findOne({ userId: returnItem.userId });
      if (userWallet) {
        userWallet.balance += returnItem.refundAmount;
        userWallet.transactionHistory.push({
          type: "credit",
          amount: returnItem.refundAmount,
          message: `Refund for return products`,
          date: new Date(),
        });
        await userWallet.save();
      } else {
        const newWallet = new Wallet({
          userId: returnItem.userId,
          balance: returnItem.refundAmount,
          transactionHistory: [
            {
              type: "credit",
              amount: returnItem.refundAmount,
              message: `Refund for return products`,
              date: new Date(),
            },
          ],
        });
        await newWallet.save();
      }
    }
    if (status === "rejected") {
      returnItem.refundStatus = "failed";
    }
    await returnItem.save();

    success(res, HttpStatus.OK, "Status updated successfully", { return: returnItem });
  } catch (error) {
    console.error("Error updating return status:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};
module.exports = {
  loadReturns,
  updateReturnStatus,
};
