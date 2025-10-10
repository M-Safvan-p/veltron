const Coupon = require("../../models/common/couponSchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");

const loadCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const totalCoupons = await Coupon.countDocuments();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.render("admin/coupon", {
      layout: "layouts/adminLayout",
      admin: req.admin,
      activePage: "coupons",
      coupons,
      currentPage: page,
      totalCoupons,
      totalPages: Math.ceil(totalCoupons / limit),
    });
  } catch (err) {
    console.error("Error loading coupons:", err);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const addCoupon = async (req, res) => {
  try {
    const { code, description, minPurchase, discount, expiryDate, maxUsage } = req.body;
    // CHECK ALREADY EXIST
    const find = await Coupon.findOne({ code: code.toUpperCase() });
    console.log("find", find);
    if (find) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.COUPON_ALREADY_EXIST);
    //SAVE
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      description,
      minPurchase,
      discount,
      expiryDate,
      maxUsage,
    });
    await newCoupon.save();
    return success(res, HttpStatus.CREATED);
  } catch (error) {
    console.log("add coupon error", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const { code, description, minPurchase, discount, expiryDate, maxUsage } = req.body;
    // check code already exist
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon && existingCoupon._id.toString() !== couponId)
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.COUPON_ALREADY_EXIST);

    await Coupon.findByIdAndUpdate(couponId, { code, description, minPurchase, discount, expiryDate, maxUsage });
    success(res, HttpStatus.OK);
  } catch (error) {
    console.error("edit coupon error", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const listAndUnlist = async (req, res) => {
  try {
    const id = req.params.id;
    const { isActive } = req.body;
    // change
    await Coupon.findByIdAndUpdate(id, { isActive });
    return success(res, HttpStatus.OK);
  } catch (error) {
    console.log("list and unlist", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadCoupons,
  addCoupon,
  editCoupon,
  listAndUnlist,
};
