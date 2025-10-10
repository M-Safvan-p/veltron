const mongoose = require("mongoose");
const crypto = require("crypto");

const razorpay = require("../../config/razorpayConfig");
const { RAZORPAY_KEY_SECRET, RAZORPAY_KEY_ID } = require("../../config/env");

const Cart = require("../../models/user/cartSchema");
const Product = require("../../models/common/productSchema");
const Address = require("../../models/user/addressSchema");
const Order = require("../../models/common/orderSchema");
const Return = require("../../models/common/returnSchema");
const Wallet = require("../../models/user/userWalletSchema");
const Coupon = require("../../models/common/couponSchema");

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
    const walletDoc = await Wallet.findOne({ userId: req.session.user });
    const wallet = walletDoc || { balance: 0, transactionHistory: [] };
    const availableCoupons = await Coupon.find({ isActive: true, isDeleted: false, expiryDate: { $gte: new Date() } }).lean();

    if (!cart || cart.items.length === 0) {
      return res.render("user/checkout", {
        cart: { items: [] },
        subtotal: 0,
        tax: 0,
        total: 0,
        userAddresses,
        layout: "layouts/userLayout",
        availableCoupons,
        wallet,
        razorpayKey: RAZORPAY_KEY_ID,
      });
    }

    // Calculate all amount
    const { subtotal, total, tax } = calculator.calculateTotalAmount(cart);

    res.render("user/checkout", {
      cart,
      subtotal,
      tax,
      total,
      userAddresses,
      layout: "layouts/userLayout",
      availableCoupons,
      wallet,
      razorpayKey: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Load checkout error:", error);
    return res.redirect("/cart");
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    let cart = await Cart.findOne({ userId: req.session.user }).populate("items.productId");
    cart.items = await filterValidCartItems(cart.items);

    const { subtotal, tax } = calculator.calculateTotalAmount(cart);

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) return errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid coupon code");
    if (coupon.expiryDate < new Date()) return errorResponse(res, HttpStatus.BAD_REQUEST, "Coupon has expired");
    if (coupon.minPurchase && subtotal < coupon.minPurchase)
      return errorResponse(res, HttpStatus.BAD_REQUEST, `Minimum purchase amount is ₹${coupon.minPurchase.toLocaleString()}`);

    // calculate discount
    let discount = (subtotal * coupon.discount) / 100;
    const total = subtotal + tax - discount;

    success(res, HttpStatus.OK, "coupon applied successfully", {
      discount: Math.round(discount),
      discountType: "percentage",
      discountValue: coupon.discount,
      subtotal,
      tax,
      total,
    });
  } catch (error) {
    console.error("apply coupon error:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const placeOrder = async (req, res) => {
  try {
    const { paymentMethod, address: addressId, couponCode } = req.body;

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
    // coupon
    let appliedDiscount = 0;
    let couponUsed = null;
    const { subtotal, total: baseTotal } = calculator.calculateTotalAmount({ items: filtered });

    if (couponCode) {
      const foundCoupon = await Coupon.findOne({
        code: String(couponCode).toUpperCase(),
        isActive: true,
        isDeleted: false,
      }).lean();
      if (!foundCoupon) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid coupon code");
      }
      if (foundCoupon.expiryDate < new Date()) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, "Coupon has expired");
      }
      if (foundCoupon.minPurchase && subtotal < foundCoupon.minPurchase) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, `Minimum purchase amount is ₹${foundCoupon.minPurchase.toLocaleString()}`);
      }

      appliedDiscount = Math.round((subtotal * Number(foundCoupon.discount)) / 100);
      couponUsed = foundCoupon;
    }

    const total = Math.max(0, baseTotal - appliedDiscount);
    const { commission, vendorEarnings } = calculator.calculateCommission(total);

    // PRODUCT DETAILS 
    const products = filtered.map((item) => {
      const productTotal = item.discountedPrice * item.quantity;
      const { commission: productCommission, vendorEarnings: productVendorEarnings } = calculator.calculateCommission(productTotal);

      return {
        productId: item.productId,
        vendorId: item.vendorId,
        name: item.productName,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        image: item.image,
        priceAtPurchase: item.discountedPrice,
        productTotal,
        commissionAmount: productCommission,
        vendorEarning: productVendorEarnings,
        variantId: item.variantId,
      };
    });

    //  ADDRESS VALIDATION 
    const addressDoc = await Address.findOne({
      userId: req.session.user,
      "address._id": addressId,
    });
    if (!addressDoc) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ADDRESS_NOT_FOUND);
    }
    const shippingAddress = { ...addressDoc.address.id(addressId).toObject() };
    let orderPlace;

    // RAZORPAY
    if (paymentMethod === "RAZORPAY") {
      orderPlace = await Order.findOne(
        {
          customerId: req.session.user,
          paymentMethod: "RAZORPAY",
          paymentStatus: "failed",
          orderStatus: "pending",
        },
        {},
        { sort: { createdAt: -1 } }
      );

      const razorpayOrder = await razorpay.orders.create({
        amount: total * 100,
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
      });

      if (orderPlace) {
        orderPlace.razorpayOrderId = razorpayOrder.id;
        await orderPlace.save();
      } else {
        orderPlace = new Order({
          customerId: req.session.user,
          paymentMethod,
          totalAmount: total,
          totalCommissionAmount: commission,
          totalVendorEarnings: vendorEarnings,
          shippingAddress,
          products,
          paymentStatus: "failed",
          orderStatus: "pending",
          razorpayOrderId: razorpayOrder.id,
          couponApplied: couponUsed ? couponUsed._id : null,
          couponDetails: couponUsed ? { code: couponUsed.code, discount: appliedDiscount } : undefined,
        });
        await orderPlace.save();
      }

      return success(res, HttpStatus.OK, Messages.RAZORPAY_ORDER_CREAT, {
        razorpayOrderId: razorpayOrder.id,
        totalAmount: total,
        currency: "INR",
        orderId: orderPlace._id,
      });
    }

    // COD
    if (paymentMethod === "COD") {
      orderPlace = new Order({
        customerId: req.session.user,
        paymentMethod,
        totalAmount: total,
        totalCommissionAmount: commission,
        totalVendorEarnings: vendorEarnings,
        shippingAddress,
        products,
        paymentStatus: "pending",
        couponApplied: couponUsed ? couponUsed._id : null,
        couponDetails: couponUsed ? { code: couponUsed.code, discount: appliedDiscount } : undefined,
      });
      await orderPlace.save();
    }

    // WALLET
    if (paymentMethod === "WALLET") {
      const wallet = await Wallet.findOne({ userId: req.session.user });

      if (!wallet) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INSUFFICIENT_BALANCE);
      }

      if (total > wallet.balance) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INSUFFICIENT_BALANCE);
      }

      orderPlace = new Order({
        customerId: req.session.user,
        paymentMethod,
        totalAmount: total,
        totalCommissionAmount: commission,
        totalVendorEarnings: vendorEarnings,
        shippingAddress,
        products,
        paymentStatus: "paid",
        couponApplied: couponUsed ? couponUsed._id : null,
        couponDetails: couponUsed ? { code: couponUsed.code, discount: appliedDiscount } : undefined,
      });
      await orderPlace.save();

      // Deduct from wallet
      wallet.balance -= total;
      wallet.transactionHistory.push({
        amount: total,
        type: "debit",
        message: `Payment deducted for your order`,
      });
      await wallet.save();
    }

    //  AFTER ORDER PLACEMENT 
    // Clear cart
    cart.items = [];
    await cart.save();

    return success(res, HttpStatus.OK, "Order placed successfully.", {
      orderId: orderPlace._id,
      totalAmount: total,
      paymentMethod,
    });
  } catch (error) {
    console.error("Order placement error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
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
      const order = await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { paymentStatus: "paid", orderStatus: "processing" });
      if (!order) {
        return errorResponse(res, HttpStatus.NOT_FOUND, Messages.ORDER_NOT_FOUND);
      }
      // clear cart
      const cart = await Cart.findOne({ userId: req.session.user });
      cart.items = [];
      await cart.save();
      return success(res, HttpStatus.OK, Messages.PAYMENT_VERIFIED_SUCCESS);
    } else {
      await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { paymentStatus: "failed", orderStatus: "pending" });
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PAYMENT_VERIFIED_FAILED);
    }
  } catch (error) {
    console.log("Razorpay verify error:", error);
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
    console.error("order cancel error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadCheckout,
  placeOrder,
  applyCoupon,
  razorpayVerify,
  loadorders,
  loadOrderDetails,
  cancelOrder,
};
