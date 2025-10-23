const Order = require("../../models/common/orderSchema");
const Vendor = require("../../models/vendor/vendorSchema");
const { error: errorResponse } = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");

const loadOrders = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    let skip = (page - 1) * limit;

    const search = req.query.search || "";
    const sortOption = req.query.sort === "oldest" ? 1 : -1;

    let matchStage = {};

    if (search) {
      matchStage.$or = [{ orderId: { $regex: search, $options: "i" } }, { "shippingAddress.fullName": { $regex: search, $options: "i" } }];
    }

    if (req.query.status) {
      matchStage.orderStatus = req.query.status;
    }

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

    const vendors = await Vendor.find({ isBlocked: false }).select("brandName _id").lean();

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
      search,
    });
  } catch (err) {
    console.error("Error loading orders:", err);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    console.log("Order ID reached:", req.params.id);
    const orderData = await Order.findOne({ orderId: req.params.id })
      .populate("customerId", "fullName email createdAt")
      .populate("products.vendorId", "brandName brandEmail phoneNumber businessType createdAt");

    if (!orderData) {
      return res.status(404).redirect("/admin/orders");
    }

    res.render("admin/orderDetails", {
      order: orderData,
      activePage: "orders",
      admin: req.admin,
      layout: "layouts/adminLayout",
    });
  } catch (error) {
    console.error("Load order error:", error);
    return res.redirect("/admin/orders");
  }
};

module.exports = {
  loadOrders,
  loadOrderDetails,
};
