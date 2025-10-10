const mongoose = require("mongoose");
const Product = require("../../models/common/productSchema");
const Category = require("../../models/common/categorySchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const { processVariants } = require("../../helpers/productHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");

const loadProducts = async (req, res) => {
  let vendorId = req.session.vendor;
  let page = parseInt(req.query.page) || 1;
  let limit = 5;
  let skip = (page - 1) * limit;
  // sort
  const sortOption = req.query.sort === "oldest" ? 1 : -1;
  // filter
  let matchStage = { vendorId: vendorId };
  if (req.query.status) {
    matchStage["products.orderStatus"] = req.query.status;
  }
  if (req.query.category) {
    matchStage["category"] = req.query.category;
  }
  // total products
  const totalProducts = await Product.countDocuments(matchStage);
  // products
  const products = await Product.find(matchStage).sort({ createdAt: sortOption }).skip(skip).limit(limit).populate("category").lean();
  // category
  const categories = await Category.find().lean();

  res.render("vendor/loadProducts", {
    layout: "layouts/vendorLayout",
    activePage: "products",
    vendor: req.vendor,
    products,
    currentPage: page,
    totalPages: Math.ceil(totalProducts / limit),
    totalProducts,
    sort: req.query.sort || "newest",
    status: req.query.status || "",
    categories,
  });
};

const listAndUnlist = async (req, res) => {
  try {
    const id = req.params.id;
    const { isListed } = req.body;
    await Product.findByIdAndUpdate({ _id: id, vendor: req.session.vendor }, { isListed });
    return success(res, HttpStatus.OK);
  } catch (error) {
    console.error("Error while update product:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadAddProduct = async (req, res) => {
  const category = await Category.find().lean();
  res.render("vendor/loadAddProduct", {
    layout: "layouts/vendorLayout",
    activePage: "products",
    vendor: req.vendor,
    categories: category,
  });
};

const addProduct = async (req, res) => {
  try {
    const { name, description, price, discountedPrice, isListed, category, variants, specifications } = req.body;

    // Validate product
    const find = await Product.findOne({ name });
    if (find) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_ALREADY_EXISTS);

    const vendorId = req.session.vendor;
    if (!vendorId) return errorResponse(res, HttpStatus.UNAUTHORIZED, Messages.VENDOR_NOT_FOUND);

    // Normalize variants
    let normalizedVariants = variants;
    if (normalizedVariants && typeof normalizedVariants === "object" && !Array.isArray(normalizedVariants)) {
      normalizedVariants = Object.keys(normalizedVariants)
        .sort()
        .map((key) => normalizedVariants[key]);
    }

    // Process variants using helper
    const processedVariants = await processVariants(normalizedVariants, req.files, res);
    if (!processedVariants) return; // error already sent in helper

    // Create and save product
    const newProduct = new Product({
      vendorId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
      isListed: isListed === "true",
      category: category.trim(),
      specifications,
      variants: processedVariants,
    });

    await newProduct.save();

    return success(res, HttpStatus.CREATED, Messages.PRODUCT_ADDED);
  } catch (err) {
    console.error("Add product error:", err);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.redirect("/vendor/products");

    const categories = await Category.find().lean();
    const product = await Product.findOne({
      _id: id,
      vendorId: req.session.vendor,
    })
      .populate("category")
      .lean();
    if (!product) return res.redirect("/vendor/products");

    res.render("vendor/loadEditProduct", {
      layout: "layouts/vendorLayout",
      activePage: "products",
      vendor: req.vendor,
      categories,
      product,
      isEdit: true,
    });
  } catch (error) {
    console.error("Error loading product edit page:", error);
    return res.redirect("/vendor/products");
  }
};

const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_PRODUCT_ID);
    }

    const vendorId = req.session.vendor;
    if (!vendorId) {
      return errorResponse(res, HttpStatus.UNAUTHORIZED, Messages.VENDOR_NOT_FOUND);
    }

    const { name, description, price, discountedPrice, isListed, category, variants, specifications } = req.body;

    const existingProduct = await Product.findOne({ _id: productId, vendorId });
    if (!existingProduct) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.PRODUCT_NOT_FOUND);
    }

    // Check duplicate name
    const duplicateProduct = await Product.findOne({ name: name.trim(), _id: { $ne: productId } });
    if (duplicateProduct) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_ALREADY_EXISTS);
    }

    let normalizedVariants = variants;
    if (normalizedVariants && typeof normalizedVariants === "object" && !Array.isArray(normalizedVariants)) {
      normalizedVariants = Object.keys(normalizedVariants)
        .sort()
        .map((key) => normalizedVariants[key]);
    }

    if (!normalizedVariants || normalizedVariants.length === 0) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, "At least one variant is required.");
    }

    const processedVariants = await processVariants(normalizedVariants, req.files, res, existingProduct);
    if (!processedVariants) return;

    // Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, vendorId },
      {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
        isListed: isListed === "true",
        category: category.trim(),
        specifications,
        variants: processedVariants,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.PRODUCT_NOT_FOUND);
    }

    console.log("Product updated successfully:", updatedProduct._id);
    return success(res, HttpStatus.OK, Messages.PRODUCT_UPDATED);
  } catch (error) {
    console.error("Error edit product:", error.stack);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadProducts,
  listAndUnlist,
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
};
