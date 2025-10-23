const Product = require("../../models/common/productSchema");
const Category = require("../../models/common/categorySchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const PermissionStatus = require("../../constants/permissionStatus");
const Messages = require("../../constants/messages");

const loadProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const category = req.query.category || "";
    const status = req.query.status || "";

    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (status === "approved") query.isListed = true;
    if (status === "rejected") query.isListed = false;
    if (category) query.category = category;
    query.approvalStatus = { $ne: PermissionStatus.PENDING };
    console.log("query", query);
    const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("category").populate("vendorId").lean();
    const totalProducts = await Product.countDocuments(query);

    const categories = await Category.find({ isListed: true });

    res.render("admin/products", {
      layout: "layouts/adminLayout",
      activePage: "products",
      admin: req.admin,
      products,
      totalProducts,
      categories,
      currentPage: page,
      query: req.query,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    console.error("Error loading products:", error);
    res.redirect("/admin/dashboard");
  }
};

const listAndUnlist = async (req, res) => {
  try {
    const id = req.params.id;
    const { approvalStatus } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.PRODUCT_NOT_FOUND);
    }
    // Update
    await Product.findByIdAndUpdate(id, {
      approvalStatus: approvalStatus.toLowerCase(),
    });

    return success(res, HttpStatus.OK);
  } catch (error) {
    console.error("Error in listAndUnlist:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadProductsPendings = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const sort = req.query.sort || "";

    // Build query
    const query = { approvalStatus: PermissionStatus.PENDING };
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Build sort
    let sortStage = { createdAt: -1 };
    if (sort === "name-asc") sortStage = { name: 1 };
    if (sort === "name-desc") sortStage = { name: -1 };
    if (sort === "price-high") sortStage = { price: -1 };
    if (sort === "price-low") sortStage = { price: 1 };

    const products = await Product.find(query).sort(sortStage).skip(skip).limit(limit).populate("category").populate("vendorId").lean();

    const totalProducts = await Product.countDocuments(query);

    res.render("admin/productPendings", {
      layout: "layouts/adminLayout",
      activePage: "products",
      admin: req.admin,
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      query: req.query,
    });
  } catch (error) {
    console.error("Error loading pending products:", error);
    res.redirect("/admin/products");
  }
};

const approveProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.PRODUCT_NOT_FOUND);
    }
    product.approvalStatus = "approved";
    await product.save();
    return success(res, HttpStatus.OK, Messages.PRODUCT_UPDATED);
  } catch (error) {
    console.error("Error approving product:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const rejectProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, HttpStatus.FORBIDDEN, Messages.PRODUCT_NOT_FOUND);
    }
    product.approvalStatus = "rejected";
    await product.save();
    return success(res, HttpStatus.OK, Messages.PRODUCT_UPDATED);
  } catch (error) {
    console.error("Error rejecting product:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadProducts,
  listAndUnlist,
  loadProductsPendings,
  approveProduct,
  rejectProduct,
};
