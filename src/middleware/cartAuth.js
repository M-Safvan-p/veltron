const User = require("../models/user/userSchema");
const Messages = require("../constants/messages");
const HttpStatus = require("../constants/statusCodes");
const { success, error: errorResponse } = require("../helpers/responseHelper");

const cartSession = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user).lean();
      if (!user) {
        req.session.user = null;
        return errorResponse(res, HttpStatus.UNAUTHORIZED, Messages.USER_NOT_LOGIN);
      }

      if (user.isBlocked) {
        req.session.user = null;
        return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.USER_BLOCKED);
      }

      req.user = user;
      return next();
    } else {
      return errorResponse(res, HttpStatus.UNAUTHORIZED, Messages.USER_NOT_LOGIN);
    }
  } catch (err) {
    console.error("cartSession error:", err);
    req.session.user = null;
    return errorResponse(res, HttpStatus.UNAUTHORIZED, Messages.USER_NOT_LOGIN);
  }
};

module.exports = {
  cartSession,
};
