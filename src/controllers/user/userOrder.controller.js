const mongoose = require("mongoose");
const crypto = require("crypto");

const razorpay = require("../../config/razorpayConfig");
const { RAZORPAY_KEY_SECRET } = require("../../config/env");

const Cart = require("../../models/user/cartSchema");
const Product = require("../../models/common/productSchema");
const Address = require("../../models/user/addressSchema");
const Order = require("../../models/common/orderSchema");
const Return = require("../../models/common/returnSchema");

const { success, error: errorResponse } = require("../../helpers/responseHelper");
const { filterValidCartItems } = require("../../helpers/cartUttils");
const calculator = require("../../helpers/calculation");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const loadCheckout = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.session.user }).populate("items.productId");
    const address = await Address.find({ userId: req.session.user }).lean();
    if (cart) {
      cart.items = await filterValidCartItems(cart.items);
    } else {
      cart = { items: [] };
    }

    const userAddresses = address.flatMap((doc) => doc.address);

    if (!cart || cart.items.length === 0) {
      return res.render("user/checkout", {
        cart: { items: [] },
        subtotal: 0,
        tax: 0,
        total: 0,
        userAddresses,
        layout: "layouts/userLayout",
      });
    }

    // Calculate all amount
    const { subtotal, tax, total } = calculator.calculateTotalAmount(cart);

    res.render("user/checkout", {
      cart,
      subtotal,
      tax,
      total,
      userAddresses,
      layout: "layouts/userLayout",
    });
  } catch (error) {
    console.error("Load checkout error:", error);
    return res.redirect("/cart");
  }
};

const placeOrder = async (req, res) => {
  try {
    const { paymentMethod, address: addressId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ADDRESS_NOT_FOUND);
    }
    if (!paymentMethod) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PAYMENT_METHOD_NOT_FOUND);
    }

    const cart = await Cart.findOne({ userId: req.session.user }).populate("items.productId");
    if (!cart || !cart.items.length) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_EMPTY);
    }

    const filtered = await filterValidCartItems(cart.items);
    if (!filtered.length) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_EMPTY);
    }
    const { total } = calculator.calculateTotalAmount({ items: filtered });
    const { commission, vendorEarnings } = calculator.calculateCommission(total);

    const products = filtered.map((item) => {
      const priceAtPurchase = item.discountedPrice;
      const productTotal = priceAtPurchase * item.quantity;
      const { commission, vendorEarnings } = calculator.calculateCommission(productTotal);

      return {
        productId: item.productId,
        vendorId: item.vendorId,
        name: item.productName,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        image: item.image,
        priceAtPurchase,
        productTotal,
        commissionAmount: commission,
        vendorEarning: vendorEarnings,
        variantId: item.variantId,
      };
    });

    const addressDoc = await Address.findOne({
      userId: req.session.user,
      "address._id": addressId,
    });
    if (!addressDoc) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ADDRESS_NOT_FOUND);
    }

    const address = addressDoc.address.id(addressId);
    const shippingAddress = { ...address.toObject() };

    //razorpay
    if (paymentMethod === "RAZORPAY") {
      const options = {
        amount: total * 100,
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
      };
      const razorpayOrder = await razorpay.orders.create(options);

      const orderPlace = new Order({
        customerId: req.session.user,
        paymentMethod,
        totalAmount: total,
        totalCommissionAmount: commission,
        totalVendorEarnings: vendorEarnings,
        shippingAddress,
        products,
        paymentStatus: "pending",
        razorpayOrderId: razorpayOrder.id,
      });
      await orderPlace.save();

      return success(res, HttpStatus.OK, Messages.RAZORPAY_ORDER_CREAT, {
        razorpayOrderId: razorpayOrder.id,
        totalAmount: total,
        currency: "INR",
        orderId: orderPlace._id,
      });
    }

    // COD
    const orderPlace = new Order({
      customerId: req.session.user,
      paymentMethod,
      totalAmount: total,
      totalCommissionAmount: commission,
      totalVendorEarnings: vendorEarnings,
      shippingAddress,
      products,
      paymentStatus: "pending",
    });
    await orderPlace.save();

    cart.items = [];
    await cart.save();

    success(res, HttpStatus.OK, "", { success: true, orderId: orderPlace._id });
  } catch (error) {
    console.error("Order placement error:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const razorpayVerify = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = RAZORPAY_KEY_SECRET;

    // generate signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      const order = await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { paymentStatus: "paid" });
      if (!order) {
        return errorResponse(res, HttpStatus.NOT_FOUND, Messages.ORDER_NOT_FOUND);
      }
      // cart empty
      const cart = await Cart.findOne({ userId: req.session.user });
      cart.items = [];
      await cart.save();
      return success(res, HttpStatus.OK, Messages.PAYMENT_VERIFIED_SUCCESS, { succes: true });
    } else {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PAYMENT_VERIFIED_FAILED, { success: false });
    }
  } catch (error) {
    console.error("Razorpay verify error:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

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
      currentPage: page,
      orders,
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
    const order = await Order.findOne({ orderId, customerId: req.session.user });

    if (!order) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.ORDER_NOT_FOUND);
    }

    if (order.orderStatus !== "pending" && order.orderStatus !== "processing") {
      return errorResponse(res, HttpStatus.BAD_REQUEST, "Order cannot be cancelled at this stage.");
    }

    for (let product of order.products) {
      const productId = product.productId;
      const variantId = product.variantId;
      const quantity = product.quantity;

      const stockProduct = await Product.findById(productId);
      const stockVariant = stockProduct.variants.id(variantId);
      stockVariant.stock += quantity;

      await stockProduct.save();
    }
    order.orderStatus = "cancelled";
    await order.save();

    return success(res, HttpStatus.OK, "Order cancelled successfully.");
  } catch (error) {
    console.log("order cancel error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadCheckout,
  placeOrder,
  razorpayVerify,
  loadorders,
  loadOrderDetails,
  cancelOrder,
};
