const mongoose = require("mongoose");
const Order = require("../../models/common/orderSchema");
const Vendor = require("../../models/vendor/vendorSchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");

const loadOrders = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5;
    let skip = (page - 1) * limit;

    // sort
    const sortOption = req.query.sort === "oldest" ? 1 : -1;

    let matchStage = {};
    if (req.query.status) {
      matchStage.orderStatus = req.query.status;
    }
    //
    let selectedVendor = "";
    if (req.query.vendor) {
      selectedVendor = req.query.vendor;
      matchStage["products.vendorId"] = req.query.vendor;
    }

    // total orders
    const totalOrders = await Order.countDocuments(matchStage);

    const orders = await Order.find(matchStage)
      .sort({ createdAt: sortOption })
      .skip(skip)
      .limit(limit)
      .populate("customerId", "name email")
      .populate("products.productId", "name images")
      .populate("products.vendorId", "brandName name")
      .lean();

    const vendors = await Vendor.find({}).select("brandName _id").lean();

    res.render("admin/orders", {
      layout: "layouts/adminLayout",
      admin: req.admin,
      orders,
      currentPage: page,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      activePage: "orders",
      sort: req.query.sort || "newest",
      status: req.query.status || "",
      vendors,
      selectedVendor,
    });
  } catch (err) {
    console.error("Error loading orders:", err);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

// const loadOrderDetails = async (req, res) => {
//   try {
//     console.log("hai reached")
//     const orderData = await Order.findOne({ orderId: req.params.id })
//     .populate("customerId","fullName email");
//     .populate("vendorId","brandName brandEmail");
//     // console.log(orderData,"order data")
//     res.render("admin/orderDetails", {
//       order: orderData,
//       activePage: "orders",
//       admin: req.admin,
//       layout: "layouts/vendorLayout",
//     });
//   } catch (error) {
//     console.error("Load order error:", error);
//     return res.redirect("/admin/orders");
//   }
// };

module.exports = {
  loadOrders,
  // loadOrderDetails,
};
