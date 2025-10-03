const Vendor = require("../models/vendor/vendorSchema");

const checkSession = async (req, res, next) => {
  try {
    if (req.session.vendor) {
      const vendor = await Vendor.findById(req.session.vendor).lean();
      if (!vendor) {
        req.session.vendor = null;
        return res.redirect("/vendor/");
      }

      if (vendor.isBlocked) {
        req.session.vendor = null;
        return res.redirect("/vendor/");
      }

      req.vendor = vendor;
      return next();
    } else {
      return res.redirect("/vendor/");
    }
  } catch (err) {
    console.error("checkSession error:", err);
    req.session.vendor = null;
    return res.redirect("/vendor/");
  }
};

const isLogin = async (req, res, next) => {
  try {
    if (req.session.vendor) {
      const vendor = await Vendor.findById(req.session.vendor).lean();

      if (!vendor) {
        req.session.vendor = null;
        return next();
      }

      if (vendor.isBlocked) {
        req.session.vendor = null;
        return res.redirect("/vendor/");
      }

      req.vendor = vendor;
      return res.redirect("/vendor/dashboard");
    }

    return next();
  } catch (err) {
    console.error("isLogin error:", err);
    req.session.vendor = null;
    return next();
  }
};

module.exports = {
  checkSession,
  isLogin,
};
