const Order = require("../../models/common/orderSchema");
const Product = require("../../models/common/productSchema");
const Wallet = require("../../models/user/userWalletSchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const loadOrders = async (req, res) => {
  try {
    let vendorId = req.session.vendor;
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    let skip = (page - 1) * limit;

    const sortOption = req.query.sort === "oldest" ? 1 : -1;

    let matchStage = { "products.vendorId": vendorId };

    if (req.query.status) {
      matchStage["products.orderStatus"] = req.query.status;
    }

    if (req.query.search) {
      const searchTerm = req.query.search;
      matchStage.orderId = { $regex: searchTerm, $options: "i" };
    }

    const totalOrders = await Order.countDocuments(matchStage);

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
      search: req.query.search || "",
    });
  } catch (err) {
    console.error("Error loading orders:", err);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Order ID:", id);
    console.log("Vendor ID:", req.session.vendor);
    const orderData = await Order.aggregate([
      { $match: { orderId: id } },
      {
        $addFields: {
          products: {
            $filter: {
              input: "$products",
              as: "product",
              cond: { $eq: [{ $toString: "$$product.vendorId" }, req.session.vendor] },
            },
          },
        },
      },
    ]);

    const order = orderData[0];

    // remove cancelled products
    const vendorProducts = order.products.filter(
      (product) => product.vendorId.toString() === req.session.vendor && product.orderStatus !== "cancelled"
    );
    // Calculate vendor-specific totals from filtered products
    const totalItems = vendorProducts.reduce((sum, product) => sum + product.quantity, 0);
    const vendorSubtotal = vendorProducts.reduce((sum, product) => sum + product.subTotal, 0);
    const vendorTax = vendorProducts.reduce((sum, product) => sum + product.tax, 0);
    const vendorDiscount = vendorProducts.reduce((sum, product) => sum + (product.discount || 0), 0);
    const totalVendorEarnings = vendorProducts.reduce((sum, product) => sum + product.vendorEarning, 0);
    const totalCommission = vendorProducts.reduce((sum, product) => sum + product.commissionAmount, 0);

    const vendorFinalTotal = vendorSubtotal - vendorDiscount + vendorTax;

    res.render("vendor/orderDetails", {
      activePage: "orders",
      vendor: req.vendor,
      order,
      summary: {
        totalItems,
        subtotal: vendorSubtotal,
        gst: vendorTax,
        discount: vendorDiscount,
        finalTotal: vendorFinalTotal,
        totalVendorEarnings,
        totalCommission,
      },
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
    const vendorId = req.session.vendor;

    const orderData = await Order.findOne({ orderId: orderId, "products.vendorId": vendorId });
    if (!orderData) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.ORDER_NOT_FOUND);
    }
    // check payment status 
    if(orderData.paymentStatus==="failed"){
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PAYMENT_FAILED_ORDER);
    }
    // update status
    orderData.products.forEach((product) => {
      if (product.vendorId.toString() === vendorId) {
        product.orderStatus = orderStatus;
      }
    });
    await orderData.save();

    // Order status update
    const fullOrder = await Order.findById(orderData._id);
    const statuses = fullOrder.products.map((p) => p.orderStatus);

    if (statuses.every((s) => s === "cancelled")) {
      fullOrder.orderStatus = "cancelled";
    } else if (statuses.every((s) => s === "failed")) {
      fullOrder.orderStatus = "failed";
    } else if (statuses.every((s) => s === "returned")) {
      fullOrder.orderStatus = "returned";
    } else {
      const activeStatuses = statuses.filter((s) => !["cancelled", "failed", "returned"].includes(s));

      if (activeStatuses.length > 0 && activeStatuses.every((s) => s === "shipped")) {
        fullOrder.orderStatus = "shipped";
      } else if (activeStatuses.length > 0 && activeStatuses.every((s) => s === "completed")) {
        fullOrder.orderStatus = "completed";
      } else {
        fullOrder.orderStatus = "processing";
      }
    }

    await fullOrder.save();

    // if cancelled or failed update stock and refund
    if (orderStatus === "cancelled" || orderStatus === "failed") {
      for (const product of orderData.products) {
        if (product.vendorId.toString() === vendorId && (product.orderStatus === "cancelled" || product.orderStatus === "failed")) {
          const { productId, variantId, quantity } = product;

          const stockProduct = await Product.findById(productId);
          if (!stockProduct) continue;

          const stockVariant = stockProduct.variants.id(variantId);
          if (!stockVariant) continue;

          stockVariant.stock += quantity;
          await stockProduct.save();
        }
      }
    }
    if ((orderStatus === "cancelled" || orderStatus === "failed") && orderData.paymentMethod !== "COD" && orderData.paymentStatus === "paid") {
      let refundAmount = 0;
      orderData.products.forEach((product) => {
        if (product.vendorId.toString() === vendorId && (product.orderStatus === "cancelled" || product.orderStatus === "failed")) {
          refundAmount += product.productTotal || 0;
        }
      });

      const userWallet = await Wallet.findOne({ userId: orderData.customerId });
      if (userWallet) {
        userWallet.balance += refundAmount;
        userWallet.transactionHistory.push({
          type: "credit",
          amount: refundAmount,
          message: `Refund for cancelled products from vendor`,
          date: new Date(),
        });
        await userWallet.save();
      } else {
        const newWallet = new Wallet({
          userId: orderData.customerId,
          balance: refundAmount,
          transactionHistory: [
            {
              type: "credit",
              amount: refundAmount,
              message: `Refund for cancelled products from vendor`,
              date: new Date(),
            },
          ],
        });
        await newWallet.save();
      }
    }

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
