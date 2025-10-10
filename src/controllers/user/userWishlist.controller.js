const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const Wishlist = require("../../models/user/wishlistSchema");
const Product = require("../../models/common/productSchema");

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const wishlistItems = await Wishlist.find({ userId }).populate("productId");

    const items = wishlistItems
      .filter((item) => item.productId.isListed)
      .map((item) => {
        const product = item.productId;
        const variant = product.variants.find((v) => v._id.toString() === item.variantId.toString());
        return { product, variant };
      });

    console.log(items, "hi");
    res.render("user/wishlist", {
      user: req.user,
      items,
      layout: "layouts/userLayout",
      currentPage: "wishlist",
    });
  } catch (error) {
    console.error("Load wishlist error:", error);
    return res.redirect("/sale");
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, variantId } = req.body;
    //check product
    const find = await Product.findOne({ _id: productId, isListed: true, approvalStatus: "approved" });
    if (!find) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_NOT_FOUND);
    console.log("hi", find);
    // check already exist
    const existing = await Wishlist.findOne({ userId, productId, variantId });
    if (existing) return errorResponse(res, HttpStatus.CONFLICT, Messages.PRODUCT_ALREADY_EXISTS_IN_WISHLIST);

    // add to wishlist
    const newProduct = new Wishlist({
      userId: req.session.user,
      productId,
      variantId,
    });
    await newProduct.save();
    success(res, HttpStatus.OK, Messages.PRODUCT_ADDED_IN_WISHLIST);
  } catch (error) {
    console.log("ad wishliust error", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, variantId } = req.params;
    // get the item
    const existingItem = await Wishlist.findOne({ userId, productId, variantId });
    // Remove the item
    await Wishlist.deleteOne({ _id: existingItem._id });
    return success(res, HttpStatus.OK);
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
};
