const Customer = require("../../models/user/userSchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");

const loadCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "";

    // Build match stage
    const matchStage = {};
    if (search) {
      matchStage.fullName = { $regex: search, $options: "i" };
    }
    if (status === "active") matchStage.isBlocked = false;
    if (status === "blocked") matchStage.isBlocked = true;

    // Build sort stage
    let sortStage = { createdAt: -1 };
    if (sort === "name-asc") sortStage = { fullName: 1 };
    if (sort === "name-desc") sortStage = { fullName: -1 };
    if (sort === "orders-high") sortStage = { orderCount: -1 };
    if (sort === "orders-low") sortStage = { orderCount: 1 };

    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "orders",
          let: { customerId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$customerId", "$$customerId"] } } }, { $group: { _id: null, orderCount: { $sum: 1 } } }],
          as: "ordersData",
        },
      },
      {
        $addFields: {
          orderCount: {
            $cond: [{ $gt: [{ $size: "$ordersData" }, 0] }, { $arrayElemAt: ["$ordersData.orderCount", 0] }, 0],
          },
        },
      },
      // 👇 Add wallet lookup
      {
        $lookup: {
          from: "userwallets", // 👈 make sure this matches your actual MongoDB collection name
          localField: "wallet",
          foreignField: "_id",
          as: "walletData",
        },
      },
      {
        $addFields: {
          wallet: {
            $cond: [{ $gt: [{ $size: "$walletData" }, 0] }, { $arrayElemAt: ["$walletData", 0] }, null],
          },
        },
      },
      { $project: { ordersData: 0, walletData: 0 } },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ];

    // Get total count for pagination
    const countPipeline = [{ $match: matchStage }];
    const customers = await Customer.aggregate(pipeline);
    const countResult = await Customer.aggregate(countPipeline);
    const totalCustomers = countResult.length;

    res.render("admin/customers", {
      layout: "layouts/adminLayout",
      activePage: "customers",
      admin: req.admin,
      customers,
      totalCustomers,
      currentPage: page,
      totalPages: Math.ceil(totalCustomers / limit),
      query: req.query,
    });
  } catch (error) {
    console.log("Customers page load Error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const blockAndUnblock = async (req, res) => {
  try {
    const id = req.params.id;
    const isBlocked = req.body.isBlocked === true || req.body.isBlocked === "true";
    //find
    const user = Customer.findById(id);
    if (!user) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.LOGIN_USER_NOT_FOUND);
    //change
    await Customer.findByIdAndUpdate(id, { isBlocked });
    //session clear if login
    req.session.user = null;
    return success(res, HttpStatus.OK);
  } catch (error) {
    console.log("block and unblock err", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadCustomers,
  blockAndUnblock,
};
