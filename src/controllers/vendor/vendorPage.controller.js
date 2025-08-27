const loadDashboard = async (req, res) => {
  res.render("vendor/dashboard", {
    layout: "layouts/vendorLayout",
    activePage: "dashboard",
    vendor:req.vendor
  });
};

const loadProducts = async (req, res) => {
  res.render("vendor/products", {
    layout: "layouts/vendorLayout",
    activePage: "products",
    vendor:req.vendor
  });
};

const loadAddProduct = async (req, res) => {
  res.render("vendor/addProduct", {
    layout: "layouts/vendorLayout",
    activePage: "products",
    vendor:req.vendor
  });
}


module.exports = {
  loadDashboard,
  loadProducts,
  loadAddProduct,
};
