const Category = require("../../models/common/categorySchema");

const loadCategory = async (req, res) => {
  const category = await Category.find({});
  res.render("admin/category", {
    layout: "layouts/adminLayout",
    activePage: "category",
    admin:req.admin,
    category,
  });
};

const addCategory = (req, res) => {
  res.render("admin/addCategory", {
    layout: "layouts/adminLayout",
    activePage: "category",
    admin:req.admin,
  });
};

module.exports = {
    loadCategory,
    addCategory,
};