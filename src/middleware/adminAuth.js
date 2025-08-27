const Admin = require("../models/admin/adminSchema");

const checkSession = async (req, res, next) => {
  if (req.session.admin) {
    const admin = await Admin.findOne();
    if (!admin) {
      req.session.admin = null;
      return res.redirect("/admin/login");
    }
    req.admin = admin;
    return next();
  }
  return res.redirect("/admin/login");
};

const isLogin = async (req, res, next) => {
  if (req.session.admin) {
    const admin = await Admin.findOne();
    if (admin) {
      req.admin = admin;
      return res.redirect("/admin/dashboard");
    }
    req.session.admin = null;
  }
  return next();
};

module.exports = { checkSession, isLogin };
