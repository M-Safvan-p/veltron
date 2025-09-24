const mongoose = require("mongoose");
const Order = require("../../models/common/orderSchema");
const Product = require("../../models/common/productSchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const loadOrders = async (req, res) => {
  try {
    let vendorId = req.session.vendor;
    let page = parseInt(req.query.page) || 1;
    let limit = 5;
    let skip = (page - 1) * limit;
    // sort
    const sortOption = req.query.sort === "oldest" ? 1 : -1;
    // filter
    let matchStage = { "products.vendorId": vendorId };
    if (req.query.status) {
      matchStage["products.orderStatus"] = req.query.status;
    }
    // total orders
    const totalOrders = await Order.countDocuments(matchStage);
    // find
    const orders = await Order.find(matchStage).sort({ createdAt: sortOption }).skip(skip).limit(limit).populate("products.productId").lean();

    res.render("vendor/orders", {
      layout: "layouts/vendorLayout",
      vendor: req.vendor,
      orders,
      currentPage: page,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      activePage: "orders",
      sort: req.query.sort || "newest",
      status: req.query.status || "",
    });
  } catch (err) {
    console.error("Error loading orders:", err);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const orderData = await Order.aggregate([
      { $match: { orderId: id } },
      {
        $addFields: {
          products: {
            $filter: {
              input: "$products",
              as: "product",
              cond: { $eq: ["$$product.vendorId", new mongoose.Types.ObjectId(req.session.vendor)] },
            },
          },
        },
      },
    ]);
    // console.log(orderData[0].products, "after aggregation");
    if (!orderData.length) return res.redirect("/vendor/orders");

    const order = orderData[0];

    const vendorSubtotal = order.products.reduce((sum, product) => sum + product.priceAtPurchase * product.quantity, 0);

    const commissionRate = 0.1; // 10% commission (90% vendor share)
    const vendorShare = Math.round(vendorSubtotal * (1 - commissionRate));
    const commissionShare = Math.round(vendorSubtotal * commissionRate);

    res.render("vendor/orderDetails", {
      activePage: "orders",
      vendor: req.vendor,
      order,
      vendorShare,
      commissionShare,
      layout: "layouts/vendorLayout",
    });
  } catch (error) {
    console.error("Load order error:", error);
    return res.redirect("/vendor/orders");
  }
};

const handleStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { orderStatus } = req.body;
    const vendorId = new mongoose.Types.ObjectId(req.session.vendor);

    const orderData = await Order.aggregate([
      { $match: { orderId: orderId } },
      {
        $addFields: {
          products: {
            $filter: {
              input: "$products",
              as: "product",
              cond: { $eq: ["$$product.vendorId", vendorId] },
            },
          },
        },
      },
    ]);

    if (!orderData.length) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.ORDER_NOT_FOUND);
    }

    const order = orderData[0];

    // if cancell stock updation
    if (orderStatus === "cancelled") {
      for (const product of order.products) {
        const { productId, variantId, quantity } = product;

        const stockProduct = await Product.findById(productId);
        if (!stockProduct) continue;

        const stockVariant = stockProduct.variants.id(variantId);
        if (!stockVariant) continue;

        stockVariant.stock += quantity;
        await stockProduct.save();
      }
    }

    // Update the order status in the DB
    await Order.updateOne({ orderId, "products.vendorId": vendorId }, { $set: { "products.$.orderStatus": orderStatus } });

    return success(res, HttpStatus.OK, Messages.ORDER_STATUS_UPDATED);
  } catch (error) {
    console.log("order status update error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadOrders,
  loadOrderDetails,
  handleStatus,
};
