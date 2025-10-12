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

    // Filters
    const sort = req.query.sort || "newest";
    const filterStatus = req.query.status || "";

    // Build query - only returns for this vendor's products
    let query = {
      // Add vendor filter if you have vendor-specific returns
      // vendorId: req.vendor._id 
    };
    
    if (filterStatus) {
      query.status = filterStatus;
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case "oldest":
        sortOption = { returnDate: 1 };
        break;
      case "newest":
      default:
        sortOption = { returnDate: -1 };
    }

    // Get returns with populated data
    const returns = await Return.find(query)
      .populate({
        path: "orderId",
        select: "shippingAddress orderDate totalAmount"
      })
      .populate({
        path: "userId",
        select: "fullName email phone"
      })
      .populate({
        path: "items.productId",
        select: "name variants"
      })
      .sort(sortOption)
      .limit(limit)
      .skip(skip)
      .lean(); // Add lean() for better performance

    const totalReturns = await Return.countDocuments(query);
    const totalPages = Math.ceil(totalReturns / limit);

    // Calculate stats
    const pendingCount = await Return.countDocuments({ 
      ...query,
      status: "pending" 
    });
    
    const currentDate = new Date();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(), 
      currentDate.getMonth(), 
      1
    );
    
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
      return errorResponse(res, HttpStatus.NOT_FOUND, 'Return not found');
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
          transactionHistory: [{
            type: "credit",
            amount: returnItem.refundAmount,
            message: `Refund for return products`,
            date: new Date(),
          }],
        });
        await newWallet.save();
      }
    }
    if (status === "rejected") {
      returnItem.refundStatus = "failed"; 
    }
    await returnItem.save();

    success(res, HttpStatus.OK, 'Status updated successfully', { return: returnItem });
  } catch (error) {
    console.error("Error updating return status:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};
module.exports = {
    loadReturns,
    updateReturnStatus,
};
