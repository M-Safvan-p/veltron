const User = require("../models/user/userSchema");

const checkSession = async (req, res, next) => {

  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user).lean();

      if (!user) {
        req.session.user = null;
        return res.redirect("/logIn");
      }

      if (user.isBlocked) {
        req.session.user = null;
        return res.redirect("/logIn");
      }

      req.user = user;
      return next();
    } else {
      return res.redirect("/logIn");
    }
  } catch (err) {
    console.error("checkSession error:", err);
    req.session.user = null;
    return res.redirect("/logIn");
  }
};

const isLogin = async (req, res, next) => {
  try {

    if (req.session.user) {
      const user = await User.findById(req.session.user).lean();

      if (!user) {
        req.session.user = null;
        return next();
      }

      if (user.isBlocked) {
        req.session.user = null;
        return res.redirect("/logIn");
      }

      req.user = user;
      return res.redirect("/home");
    }

    return next();
  } catch (err) {
    console.error("isLogin error:", err);
    req.session.user = null;
    return next();
  }
};

module.exports = {
  checkSession,
  isLogin,
};
