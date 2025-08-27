//const User = require("../models/user/userSchema");

// const checkSession = async (req, res, next) => {
//   if (req.session.user) {
//     // const user = await User.findById(req.session.user);
//     // req.user = user;
//     return next();
//   } else {
//     return res.redirect("/logIn");
//   }
// };

// const isLogin = async (req, res, next) => {
//   if (req.session.user) {
//     // const user = await User.findById(req.session.user);
//     // req.user = user;
//     return res.redirect("/home");
//   }
//   return next();
// };

// module.exports = {
//   checkSession,
//   isLogin,
// };
