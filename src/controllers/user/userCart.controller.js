const mongoose = require("mongoose");
const Cart = require("../../models/user/cartSchema");
const Product = require("../../models/common/productSchema");

const { success, error: errorResponse } = require("../../helpers/responseHelper");
const { filterValidCartItems } = require("../../helpers/cartUttils");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const loadCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user }).populate("items.productId");
    if (cart) {
      const validItems = await filterValidCartItems(cart.items);
      cart.items = validItems;
      await cart.save();
    }

    res.render("user/cart", {
      cart: cart || { items: [] },
      layout: "layouts/userLayout",
    });
  } catch (error) {
    console.error("Load cart error:", error);
    return res.redirect("/sale");
  }
};

const cartAdd = async (req, res) => {
  try {
    const { variantId, productId } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(variantId)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_ADD_FAILED);
    if (!mongoose.Types.ObjectId.isValid(productId)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_ADD_FAILED);


    // Find product
    const product = await Product.findById(productId);
    if (!product) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_NOT_FOUND);
    const variant = product.variants.id(variantId);

    // Check if product is available
    if (!product.isListed) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_NOT_FOUND);
    if (product.productStatus !== "Available") return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_NOT_FOUND);
    if (!variant) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_NOT_FOUND);
    if (variant.stock < 1) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_OUT_OF_STOCK);

    // Find or create cart
    let cart = await Cart.findOne({ userId: req.session.user });
    if (!cart) {
      cart = new Cart({ userId: req.session.user, items: [] });
    }

    // Find existing item index
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString() && item.variantId.toString() === variantId.toString()
    );

    if (existingItemIndex !== -1) {
      const nextQuantity = cart.items[existingItemIndex].quantity + 1;

      if (nextQuantity > 4) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_QUANTITY_LIMIT);
      }

      if (nextQuantity > variant.stock) {
        return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_QUANTITY_LIMIT);
      }

      cart.items[existingItemIndex].quantity = nextQuantity;
    } else {
      cart.items.push({
        productId,
        productName: product.name,
        quantity: 1,
        price: product.price,
        discountedPrice: product.discountedPrice,
        image: variant.images[0]?.url || "",
        selectedColor: variant.color,
        variantId: variantId,
      });
    }

    await cart.save();
    return success(res, HttpStatus.OK, Messages.CART_ADD_SUCCESS);
  } catch (error) {
    console.log("Add product to cart Error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const cartRemove = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_REMOVE_FAILED);
    let cart = await Cart.findOne({ userId: req.session.user });
    //find
    cart.items = cart.items.filter((item) => item._id.toString() != id);
    //save
    await cart.save();
    return success(res, HttpStatus.OK);
  } catch (error) {
    console.log("cart remove eroor", error);
    errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_REMOVE_FAILED);
  }
};

const cartEmpty = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user });
    cart.items = [];
    await cart.save();
    success(res, HttpStatus.OK);
  } catch (error) {
    console.log("cart remove eroor", error);
    errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_REMOVE_FAILED);
  }
};

const cartIncrease = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, HttpStatus.BAD_REQUEST);

    const cart = await Cart.findOne({ userId: req.session.user }).populate("items.productId");
    const item = cart.items.find((item) => item.variantId.toString() == id);

    const product = item.productId;
    const variant = product.variants.find((v) => v._id.toString() == id);
    //limit
    if (variant.stock <= item.quantity) return errorResponse(res, HttpStatus.NOT_FOUND, Messages.CART_QUANTITY_LIMIT);
    if (item.quantity >= 5) return errorResponse(res, HttpStatus.NOT_FOUND, Messages.CART_QUANTITY_LIMIT);
    item.quantity += 1;
    //save
    await cart.save();
    success(res, HttpStatus.OK);
  } catch (error) {
    console.log("Quantity increase error", error);
    errorResponse(res, HttpStatus.BAD_REQUEST);
  }
};

const cartDecrease = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, HttpStatus.BAD_REQUEST);

    const cart = await Cart.findOne({ userId: req.session.user });
    const item = cart.items.find((item) => item.variantId.toString() == id);
    //limit
    if (item.quantity <= 1) return errorResponse(res, HttpStatus.BAD_REQUEST);
    item.quantity -= 1;
    //save
    await cart.save();
    success(res, HttpStatus.OK);
  } catch (error) {
    console.log("Quantity decrese error", error);
    errorResponse(res, HttpStatus.BAD_REQUEST);
  }
};

module.exports = {
  loadCart,
  cartAdd,
  cartRemove,
  cartEmpty,
  cartIncrease,
  cartDecrease,
};
