const loadDashboard = async (req, res) => {
  res.render("admin/dashboard", {
    layout: "layouts/adminLayout",
    activePage: "dashboard",
    admin:req.admin,
  });
};

module.exports = {
    loadDashboard,
}