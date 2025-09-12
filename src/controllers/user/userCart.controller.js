const mongoose = require('mongoose');
const Cart = require('../../models/user/cartSchema');
const Product = require('../../models/common/productSchema');

const { success, error: errorResponse } = require('../../helpers/responseHelper');
const Messages = require('../../constants/messages');
const HttpStatus = require('../../constants/statusCodes');

const loadCart = async (req, res) => {
  try {
    const cart = Cart.find({userId:req.session.user});
    res.render("user/cart",{
        cart,
        layout:"layouts/userLayout",
    })
  } catch (error) {
    
  }
};

const cartAdd = async (req, res) => {
  try {
    const { variantId, productId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(variantId)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_ADD_ERROR);
    if (!mongoose.Types.ObjectId.isValid(productId)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CART_ADD_ERROR);
    console.log('id..', variantId, productId);

    //product
    const product = await Product.findById(productId);
    const variant = product.variants.id(variantId);

    console.log(product)

    //find cart
    let cart = await Cart.findOne({ userId: req.session.user });
    if (!cart) {
      cart = new Cart({ userId: req.session.user, items: [] });
    }

    //product index
    const existingItem = cart.items.findIndex(item => item.productId.toString() === productId && item.selectedColor === variant.color);
    if (existingItem != -1) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        productId,
        ProductName:product.name,
        quantity: 1,
        price: product.price,
        discountedPrice:product.discountedPrice,
        image:variant.images[0].url,
        selectedColor: variant.color,
      });
    }

    await cart.save();
    success(res, HttpStatus.OK, Messages.CART_ADD_SUCCESS);
  } catch (error) {
    console.log("Add address Error", error)
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadCart,
  cartAdd,
};
