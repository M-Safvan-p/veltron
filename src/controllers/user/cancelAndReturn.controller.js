const Product = require("../../models/common/productSchema");
const Return = require("../../models/common/returnSchema");
const Order = require("../../models/common/orderSchema");
const Wallet = require("../../models/user/userWalletSchema");

const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const { RAZORPAY_KEY_ID } = require("../../config/env");

const loadorders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments({ customerId: req.session.user });
    const orders = await Order.find({ customerId: req.session.user }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    res.render("user/orders", {
      user: req.user,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: "orders",
      orders,
      pagee: page,
      layout: "layouts/userLayout",
    });
  } catch (error) {
    console.error("Load orders error:", error);
    return res.redirect("/profile");
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const order = await Order.findOne({ orderId: id, customerId: req.session.user }).lean();
    if (!order) {
      return res.redirect("/profile/orders");
    }
    const returnData = await Return.findOne({ orderId: order._id, userId: req.session.user }).lean();
    res.render("user/orderDetails", {
      user: req.user,
      returnData,
      order,
      currentPage: "orders",
      razorpayKey: RAZORPAY_KEY_ID,
      layout: "layouts/userLayout",
    });
  } catch (error) {
    console.error("Load order error:", error);
    return res.redirect("/profile/orders");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { items } = req.body;
    console.log("items", items);

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, HttpStatus.NOT_FOUND, "Order not found");
    }

    //  cancel
    const cancelledItems = [];
    let reduceTotalAmount = 0;
    let reduceSubTotal = 0;
    let reduceTax = 0;
    let reduceDiscount = 0;

    for (const item of items) {
      const productIndex = order.products.findIndex((p) => p.productId.toString() === item.productId && p.variantId.toString() === item.variantId);
      if (productIndex === -1) continue;

      const orderProduct = order.products[productIndex];
      if (orderProduct.orderStatus === "cancelled") continue;
      order.products[productIndex].orderStatus = "cancelled";
      cancelledItems.push(orderProduct);

      // stock manage
      const stockProduct = await Product.findById(item.productId);
      const stockVariant = stockProduct.variants.id(item.variantId);
      stockVariant.stock += item.quantity;
      await stockProduct.save();

      // Calculate all reducible prices
      reduceTotalAmount += item.productTotal || 0;
      reduceSubTotal += item.subTotal || 0;
      reduceDiscount += item.discount || 0;
      reduceTax += item.tax || 0;
    }

    // Refund amount to wallet
    if (order.paymentMethod !== "COD" && order.paymentStatus === "paid") {
      let refundAmount = 0;
      for (let i = 0; i < cancelledItems.length; i++) {
        refundAmount += cancelledItems[i].productTotal;
      }

      const userWallet = await Wallet.findOne({ userId: req.session.user });
      if (userWallet) {
        userWallet.balance += refundAmount;
        userWallet.transactionHistory.push({
          amount: refundAmount,
          type: "credit",
          message: "Refund amount credited on the product cancellation",
        });
        await userWallet.save();
      }
    }

    // if all prodcut cancel
    const allItemsCancelled = order.products.every((p) => p.orderStatus === "cancelled");
    if (allItemsCancelled) {
      order.orderStatus = "cancelled";
    } else {
      // recalculate order summary
      order.totalAmount -= reduceTotalAmount;
      order.subTotal -= reduceSubTotal;
      order.tax -= reduceTax;
      if (order.discount !== undefined) order.discount -= reduceDiscount;
    }

    await order.save();

    return success(res, HttpStatus.OK, "Items cancelled successfully", {
      cancelledItems: cancelledItems.length,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Order cancel error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, "Server error occurred");
  }
};

const returnRequest = async (req, res) => {
  try {
    const { orderId, items, reason } = req.body;
    const userId = req.session.user;
    if (!orderId || !items || items.length === 0 || !reason) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid request data");
    }

    console.log("items", ...items);
    const order = await Order.findById(orderId);
    if (!order) {
      errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ORDER_NOT_FOUND);
    }

    const validItems = [];
    for (const item of items) {
      const orderItem = order.products.find(
        (p) => p.productId.toString() === item.productId && p.vendorId.toString() === item.vendorId && p.variantId === item.variantId
      );

      if (!orderItem) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ORDER_ITEM_NOT_FOUND(item.productId, item.variantId));
      }

      if (item.quantity > orderItem.quantity) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ORDER_RETURN_QUANTITY_EXCEEDS(item.productId));
      }

      validItems.push({
        productId: orderItem.productId,
        vendorId: orderItem.vendorId,
        variantId: orderItem.variantId,
        name: orderItem.name,
        quantity: item.quantity,
        finalProductPrice: orderItem.productTotal,
        vendorEarning: orderItem.vendorEarning,
        commissionAmount: orderItem.commissionAmount,
        priceAtPurchase: orderItem.priceAtPurchase,
        subTotal: orderItem.subTotal,
        tax: orderItem.tax,
        discount: orderItem.discount,
      });
    }
    const refundAmount = validItems.reduce((sum, item) => sum + item.finalProductPrice, 0);

    // Update order items status
    const newReturn = new Return({
      orderId,
      userId,
      items: validItems,
      reason,
      refundAmount,
    });

    await newReturn.save();

    success(res, HttpStatus.CREATED, "", { returnData: newReturn });
  } catch (error) {
    console.error("order return error:", error.message);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadorders,
  loadOrderDetails,
  cancelOrder,
  returnRequest,
};
