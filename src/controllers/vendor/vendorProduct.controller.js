const Product = require("../../models/common/productSchema");
const Category = require("../../models/common/categorySchema");

const loadProducts = async (req, res) => {
  const category = await Category.find();
  const products = await Product.find();
  res.render("vendor/loadProducts", {
    layout: "layouts/vendorLayout",
    activePage: "products",
    vendor: req.vendor,
    category,
    products,
  });
};

const loadAddProduct = async (req, res) => {
  const category = await Category.find();
  res.render("vendor/loadAddProduct", {
    layout: "layouts/vendorLayout",
    activePage: "products",
    vendor: req.vendor,
    categories:category
  });
};

module.exports = {
  loadProducts,
  loadAddProduct,
};
