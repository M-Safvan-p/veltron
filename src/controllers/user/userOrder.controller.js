const mongoose = require("mongoose");
const crypto = require("crypto");

const razorpay = require("../../config/razorpayConfig");
const { RAZORPAY_KEY_SECRET, RAZORPAY_KEY_ID } = require("../../config/env");

const Cart = require("../../models/user/cartSchema");
const Product = require("../../models/common/productSchema");

const Address = require("../../models/user/addressSchema");
const Order = require("../../models/common/orderSchema");
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
    const { total, subtotal, tax } = calculator.calculateTotalAmount(cart);

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

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) return errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid coupon code");

    if (coupon.expiryDate < new Date()) return errorResponse(res, HttpStatus.BAD_REQUEST, "Coupon has expired");

    if (coupon.minPurchase && cart.total < coupon.minPurchase) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, `Minimum purchase amount is ₹${coupon.minPurchase.toLocaleString()}`);
    }
    // check usage
    const couponUsedTimes = (coupon.couponUsers || []).filter((user) => user.toString() === req.session.user.toString()).length;
    if (couponUsedTimes >= coupon.maxUsage) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, "Coupon has reached its maximum usage limit");
    }

    // calculation
    const { total, subtotal, tax, discount } = calculator.calculateTotalAmount(cart, coupon.discount);

    success(res, HttpStatus.OK, "coupon applied successfully", {
      discount,
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
    // validations
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ADDRESS_NOT_FOUND);
    }
    if (!paymentMethod) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PAYMENT_METHOD_NOT_FOUND);
    }

    // cart
    const cart = await Cart.findOne({ userId: req.session.user }).populate("items.productId");
    if (!cart || !cart.items.length) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_EMPTY);
    }
    const filtered = await filterValidCartItems(cart.items);
    if (!filtered.length) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_EMPTY);
    }

    // Coupon
    let appliedDiscount = 0;
    let couponUsed = null;
    if (couponCode) {
      const foundCoupon = await Coupon.findOne({ code: String(couponCode).toUpperCase(), isActive: true, isDeleted: false });
      if (!foundCoupon) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid coupon code");
      }
      if (foundCoupon.expiryDate < new Date()) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, "Coupon has expired");
      }

      const couponUsedTimes = (foundCoupon.couponUsers || []).filter((user) => user.toString() === req.session.user.toString()).length;

      if (couponUsedTimes >= foundCoupon.maxUsage) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, "Coupon has reached its maximum usage limit");
      }

      if (foundCoupon.minPurchase && cart.total < foundCoupon.minPurchase) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, `Minimum purchase amount is ₹${foundCoupon.minPurchase.toLocaleString()}`);
      }

      couponUsed = foundCoupon;
      appliedDiscount = foundCoupon.discount;
    }

    // Calculate final totals
    const { total, subtotal, tax, discount } = calculator.calculateTotalAmount({ items: filtered }, couponUsed ? couponUsed.discount : 0);
    const { commission, vendorEarnings } = calculator.calculateCommission(total);

    // Prepare product details
    const products = filtered.map((item) => {
      const { total, subtotal, tax, discount } = calculator.calculateProductTotal(item, couponUsed ? couponUsed.discount : 0);
      const { commission: productCommission, vendorEarnings: productVendorEarnings } = calculator.calculateCommission(total);
      
      return {
        productId: item.productId,
        vendorId: item.vendorId,
        name: item.productName,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        image: item.image,
        priceAtPurchase: item.discountedPrice,
        productTotal: total,
        subTotal: subtotal,
        tax: tax,
        discount,
        commissionAmount: productCommission,
        vendorEarning: productVendorEarnings,
        variantId: item.variantId,
      };
    });

    // Address
    const addressDoc = await Address.findOne({
      userId: req.session.user,
      "address._id": addressId,
    });
    if (!addressDoc) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.ADDRESS_NOT_FOUND);
    }
    const shippingAddress = { ...addressDoc.address.id(addressId).toObject() };

    // Stock validation
    for (const item of filtered) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, `Product ${item.productName} not found`);
      }

      const variant = product.variants.id(item.variantId);
      if (!variant) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, `Variant not found for ${item.productName}`);
      }

      if (variant.stock < item.quantity) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, `Insufficient stock for ${item.productName}. Available: ${variant.stock}`);
      }
    }

    let orderPlace;

    // Razorpay payment
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
          subTotal: subtotal,
          discount: discount,
          tax,
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

    // COD payment
    if (paymentMethod === "COD") {
      orderPlace = new Order({
        customerId: req.session.user,
        paymentMethod,
        totalAmount: total,
        subTotal: subtotal,
        discount: discount,
        tax,
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

    // Wallet payment
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
        subTotal: subtotal,
        discount: discount,
        tax,
        totalCommissionAmount: commission,
        totalVendorEarnings: vendorEarnings,
        shippingAddress,
        products,
        paymentStatus: "paid",
        couponApplied: couponUsed ? couponUsed._id : null,
        couponDetails: couponUsed ? { code: couponUsed.code, discount: appliedDiscount } : undefined,
      });
      await orderPlace.save();

      // Deduct wallet balance
      wallet.balance -= total;
      wallet.transactionHistory.push({
        amount: total,
        type: "debit",
        message: `Payment deducted for your order`,
      });
      await wallet.save();
    }

    // Update coupon usage
    if (couponUsed) {
      await Coupon.findByIdAndUpdate(couponUsed._id, {
        $addToSet: { couponUsers: req.session.user },
      });
    }

    // Reduce stock
    for (const item of filtered) {
      await Product.findOneAndUpdate({ _id: item.productId, "variants._id": item.variantId }, { $inc: { "variants.$.stock": -item.quantity } });
    }

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

module.exports = {
  loadCheckout,
  placeOrder,
  applyCoupon,
  razorpayVerify,
};
