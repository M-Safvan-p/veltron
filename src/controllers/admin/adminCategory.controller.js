const mongoose = require("mongoose");
const Category = require("../../models/common/categorySchema");
const Product = require("../../models/common/productSchema");
const formValidator = require("../../helpers/formValidator");
const HttpStatus = require("../../constants//statusCodes");
const Messages = require("../../constants/messages");
const { success, error: errorResponse } = require("../../helpers/responseHelper");

const loadCategory = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * 5;

  const search = req.query.search || "";
  const status = req.query.status || "";
  const offer = req.query.offer || "";
  const sort = req.query.sort || "";

  const query = {};
  if (search) query.name = { $regex: search, $options: "i" };
  if (status === "listed") query.isListed = true;
  if (status === "unlisted") query.isListed = false;
  if (offer === "with-offer") query.offer = { $gt: 0 };
  if (offer === "no-offer") query.offer = { $in: [0, null] };

  let sortOption = { createdAt: -1 };
  if (sort === "name-asc") sortOption = { name: 1 };
  if (sort === "name-desc") sortOption = { name: -1 };
  if (sort === "offer-high") sortOption = { offer: -1 };
  if (sort === "offer-low") sortOption = { offer: 1 };

  const totalCategories = await Category.countDocuments(query);
  const category = await Category.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

  res.render("admin/category", {
    layout: "layouts/adminLayout",
    activePage: "category",
    admin: req.admin,
    category,
    currentPage: page,
    totalCategories,
    totalPages: Math.ceil(totalCategories / limit),
    query: req.query,
  });
};

const listAndUnlist = async (req, res) => {
  try {
    const id = req.params.id;
    const { isListed } = req.body;
    //change
    await Category.findByIdAndUpdate(id, { isListed });
    return success(res, HttpStatus.OK);
  } catch (error) {
    console.log("list and unlist", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadAddCategory = (req, res) => {
  res.render("admin/addCategory", {
    layout: "layouts/adminLayout",
    activePage: "category",
    admin: req.admin,
  });
};

const addCategory = async (req, res) => {
  try {
    const { name, description, offer, isListed } = req.body;
    //for case sensitive
    const normalised = name.trim().toLowerCase();

    const findCategory = await Category.findOne({ name: normalised });
    if (findCategory) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.CATEGORY_ALREADY_EXISTS);

    //validationn
    const errorMessage = formValidator.validateCategory(normalised, description, offer, isListed);
    if (errorMessage) return errorResponse(res, HttpStatus.BAD_REQUEST, errorMessage);

    const saveCategory = new Category({
      name: normalised,
      description,
      offer,
      isListed: isListed == "true",
    });

    await saveCategory.save();

    return success(res, HttpStatus.CREATED, Messages.CATEGORY_ADDED, {
      redirectUrl: "/admin/category",
    });
  } catch (error) {
    console.error("Error add category:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.INTERNAL_SERVER_ERROR);
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.redirect("/admin/category");
    const category = await Category.findById(id).lean();
    res.render("admin/editCategory", {
      layout: "layouts/adminLayout",
      activePage: "category",
      admin: req.admin,
      category,
    });
  } catch (error) {
    console.error("Error loading edit category page:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.INTERNAL_SERVER_ERROR);
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.redirect("/admin/category");
    const { name, description, offer, isListed } = req.body;
    //validation
    const errorMessage = formValidator.validateCategory(name, description, offer, isListed);
    if (errorMessage) return errorResponse(res, HttpStatus.BAD_REQUEST, errorMessage);

    //for case sensitive
    const normalised = name.trim().toLowerCase();

    await Category.findByIdAndUpdate(id, {
      name: normalised,
      description,
      offer,
      isListed: isListed == "true",
    });

    // discount price re calculate
    const products = await Product.find({ category: id });
    for (const product of products) {
      if (offer > product.offer) {
        product.discountedPrice = Math.round(product.price - (product.price * offer) / 100);
        await product.save();
      }
    }
    return success(res, HttpStatus.OK, Messages.CATEGORY_UPDATED, {
      redirectUrl: "/admin/category",
    });
  } catch (error) {
    console.error("Error edit category:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadCategory,
  loadAddCategory,
  loadEditCategory,
  addCategory,
  listAndUnlist,
  editCategory,
};
