const loadDashboard = async (req, res) => {
  res.render("vendor/dashboard", {
    layout: "layouts/vendorLayout",
    activePage: "dashboard",
    vendor:req.vendor
  });
};



module.exports = {
  loadDashboard,
};
