const User = require("../../models/user/userSchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");
const passwordControl = require("../../helpers/passwordControl");
const otpControl = require("../../helpers/otpControl");

const userQuery = require("../../helpers/userQuery");

const loadProfile = async (req, res) => {
  try {
    res.render("user/profile", {
      layout: "layouts/userLayout",
      user: req.user,
      currentPage: "profile",
    });
  } catch (error) {
    console.log("user profile load error", error);
    res.redirect("/user/home");
  }
};

const loadProfileEdit = async (req, res) => {
  try {
    res.render("user/profileEdit", {
      layout: "layouts/userLayout",
      user: req.user,
      currentPage: "profile",
    });
  } catch (error) {
    console.log("user profile load error", error);
    res.redirect("/user/profile");
  }
};

const profileEdit = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.file);

    const userId = req.session.user;
    const { fullName, phoneNumber } = req.body;

    const phoneNO = await User.findOne({
      _id: { $ne: userId },
      phoneNumber: phoneNumber,
    });
    if (phoneNO) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PHONE_ALREADY_EXISTS);

    const updateData = {
      fullName,
      phoneNumber,
    };
    //image if have
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    //update
    const updatedUser = await User.findByIdAndUpdate(userId, updateData);
    if (!updatedUser) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.LOGIN_USER_NOT_FOUND);

    console.log("Profile updated successfully");
    return success(res, HttpStatus.OK, Messages.USER_UPDATE_SUCCESS);
  } catch (error) {
    console.log("Profile edit error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.USER_UPDATE_ERROR);
  }
};

const loadChangePassword = async (req, res) => {
  try {
    res.render("user/changePassword", {
      layout: "layouts/userLayout",
      currentPage: "change-password",
      user: req.user,
    });
  } catch (error) {
    console.log("change passwore error:", error);
    res.redirect("/profile");
  }
};

const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.session.user);
    const { currentPassword, newPassword } = req.body;
    // current password check
    const checkCurrent = await passwordControl.comparePassword(currentPassword, user.password);
    if (!checkCurrent) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.WRONG_CURRENT_PASSWORD);
    // HASH
    const newHashedPassword = await passwordControl.securePassword(newPassword);
    //update
    await User.findByIdAndUpdate(user.id, { password: newHashedPassword });

    success(res, HttpStatus.OK, Messages.UPDATE_SUCCESS_PASSWORD);
  } catch (error) {
    console.log("Error in password updating", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadForgotPassword = async (req, res) => {
  try {
    const user = req.user;
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendForgotPasswordOtp(user.email, otp);
    if (!emailSent) return res.redirect("/user/profile/change-password");
    req.session.otp = otp;
    console.log("otp is :", otp);
    res.render("user/profileForgot", {
      layout: "layouts/userLayout",
      currentPage: "change-password",
      user,
    });
  } catch (error) {
    console.log("load forgot password error:", error);
    res.redirect("/profile/change-password");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const userId = req.session.user;
    const { otp, newPassword } = req.body;
    if (otp != req.session.otp) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_INVALID);
    const hashedPassword = await passwordControl.securePassword(newPassword);
    // update
    const updatedUser = await User.findByIdAndUpdate(userId, { password: hashedPassword });
    //save
    req.session.otp = null;
    await updatedUser.save();
    success(res, HttpStatus.OK);
  } catch (error) {
    ("password update error:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadChangeEmail = async (req, res) => {
  try {
    res.render("user/changeEmail", {
      layout: "layouts/userLayout",
      currentPage: "change-email",
      user: req.user,
    });
  } catch (error) {
    console.log("change email error:", error);
    res.redirect("/profile");
  }
};

const veriryEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    //validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_EMAIL);
    const checkEmail = await User.findOne({ email: newEmail });
    if (checkEmail) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.EMAIL_ALREADY_EXISTS);

    //otp send
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendChangeEmailOtp(newEmail, otp);
    if (!emailSent) return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.OTP_SEND_FAILED);
    console.log("OTP sent", otp);

    req.session.userData = { email: newEmail, otp };
    success(res, HttpStatus.OK, Messages.OTP_SENT_SUCCESS);
  } catch (error) {
    console.log("Send email is error ", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const sessionOtp = req.session.userData.otp;
    const sessionEmail = req.session.userData.email;
    const { otp } = req.body;

    //validate
    if (!req.session.userData) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_EXPIRED);

    const otpRegex = /^\d{4}$/;
    if (!otp || !otpRegex.test(otp)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_INVALID);

    //check
    if (sessionOtp !== otp) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_INVALID);

    // update email
    await User.findByIdAndUpdate(req.session.user, { email: sessionEmail });

    delete req.session.userData;

    return success(res, HttpStatus.OK, Messages.EMAIL_UPDATE_SUCCESS);
  } catch (error) {
    console.error("Verify OTP error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadProfile,
  loadProfileEdit,
  profileEdit,
  loadChangePassword,
  changePassword,
  loadForgotPassword,
  forgotPassword,
  loadChangeEmail,
  veriryEmail,
  verifyOtp,
};
