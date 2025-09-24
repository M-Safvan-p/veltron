const mongoose = require("mongoose");
const Product = require("../../models/common/productSchema");
const Order = require("../../models/common/orderSchema");
const Return = require("../../models/common/returnSchema");

const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const returnRequest = async (req, res) => {
  try {
    console.log("return req");
    const { orderId, items, reason } = req.body;
    const userId = req.user._id;
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
        priceAtPurchase: orderItem.priceAtPurchase,
        vendorEarning: orderItem.vendorEarning,
        commissionAmount: orderItem.commissionAmount,
      });
    }

    const refundAmount = validItems.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);

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
  returnRequest,
};
