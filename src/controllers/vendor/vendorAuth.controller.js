const Vendor = require("../../models/vendor/vendorSchema");
const VendorWallet = require("../../models/vendor/vendorWalletSchema");

const formValidator = require("../../helpers/formValidator");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const otpControl = require("../../helpers/otpControl");
const passwordControl = require("../../helpers/passwordControl");

const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");
const PermissionStatus = require("../../constants/permissionStatus");

const loadSignup = (req, res) => {
  res.render("vendor/signup");
};
/**
 *
 * @param {*} req
 * @param {*} res
 * @returns
 */
const signup = async (req, res) => {
  try {
    const { brandName, brandEmail, phoneNumber, password, confirmPassword } = req.body;
    console.log(req.body);
    //validation
    const errorMessage = formValidator.validateSignUp({
      name: brandName,
      email: brandEmail,
      phoneNumber,
      password,
      confirmPassword,
    });
    if (errorMessage) return errorResponse(res, HttpStatus.BAD_REQUEST, errorMessage);
    // brand email already exists
    const findEmail = await Vendor.findOne({ brandEmail: brandEmail });
    if (findEmail) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VENDOR_EMAIL_ALREADY_EXISTS);
    // phone number already exists
    const findPhone = await Vendor.findOne({ phoneNumber: phoneNumber });
    if (findPhone) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PHONE_ALREADY_EXISTS);
    // Generate OTP
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendVerificationEmail(brandEmail, otp);
    if (!emailSent) return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.OTP_SEND_FAILED);
    console.log("OTP sent", otp);
    //Pass word hash
    const hashedPassword = await passwordControl.securePassword(password);

    // Save OTP and vendor data in session
    req.session.vendorOtp = otp;
    req.session.vendorData = {
      brandEmail,
      brandName,
      phoneNumber,
      hashedPassword,
    };
    req.session.otpExpires = Date.now() + 1 * 60 * 1000;

    return success(res, HttpStatus.OK, Messages.OTP_SENT_SUCCESS, {
      redirectUrl: "/vendor/verify-otp",
    });
  } catch (error) {
    console.log("signup error ", error);

    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadVerifyOtp = (req, res) => {
  if (!req.session.vendorData) {
    return res.redirect("/vendor/signup");
  }
  res.render("vendor/verifyOtp", { email: req.session.vendorData.brandEmail });
};

const verifyOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const fullOtp = `${otp1}${otp2}${otp3}${otp4}`.trim();
    console.log("enterd otp", fullOtp);
    //validate otp
    const errorMessage = formValidator.validateOtp(fullOtp);
    if (errorMessage) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_OTP);

    // Check if OTP and user session exist
    if (!req.session.vendorOtp || !req.session.vendorData) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.SESSION_EXPIRED);

    // Check if OTP has expired
    if (Date.now() > req.session.otpExpires) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_EXPIRED);

    //compare OTP
    if (fullOtp !== req.session.vendorOtp) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_INVALID);

    // Create new vendor
    const { brandName, brandEmail, phoneNumber, hashedPassword } = req.session.vendorData;
    const newVendor = new Vendor({
      brandName,
      brandEmail,
      phoneNumber,
      password: hashedPassword,
    });
    await newVendor.save();
    // sett wallet
    const newWallet = new VendorWallet({
      vendorId: newVendor._id,
      balance: 0,
      transactionHistory: [],
    });
    await newWallet.save();
    //link

    await Vendor.findByIdAndUpdate(newVendor._id, { wallet: newWallet._id });

    // Clear session data
    req.session.vendorOtp = null;
    req.session.vendorData = null;
    req.session.otpExpires = null;

    return success(res, HttpStatus.OK, Messages.VENDOR_REGISTER_SUCCESS, {
      redirectUrl: "/vendor/login",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.INTERNAL_SERVER_ERROR);
  }
};

const loadLogin = (req, res) => {
  res.render("vendor/login");
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    const errorMessage = formValidator.validateLogIn(email, password);
    if (errorMessage) return errorResponse(res, HttpStatus.BAD_REQUEST, errorMessage);

    //check data
    const vendor = await Vendor.findOne({ brandEmail: email });
    if (!vendor) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VENDOR_NOT_FOUND);

    const isMatch = await passwordControl.comparePassword(password, vendor.password);
    if (!isMatch) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_CREDENTIALS);
    //check permission status
    if (vendor.permissionStatus == PermissionStatus.PENDING) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.REGISTRATION_PENDING);
    if (vendor.permissionStatus == PermissionStatus.REJECTED) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.REGISTRATION_REJECTED);
    // check block
    if (vendor.isBlocked) return errorResponse(res, HttpStatus.FORBIDDEN, Messages.VENDOR_BLOCKED);

    //set session
    req.session.vendor = vendor._id;

    return success(res, HttpStatus.OK, Messages.LOGIN_SUCCESS, {
      redirectUrl: "/vendor/dashboard",
    });
  } catch (error) {
    console.error("Login Error:", error);
    return error(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.INTERNAL_SERVER_ERROR);
  }
};

const logout = (req, res) => {
  try {
    req.session.vendor = null;
    delete req.session.vendor;
    res.clearCookie("connect.sid");
    res.setHeader("Cache-Control", "no-store");
    success(res, HttpStatus.OK);
  } catch (error) {
    console.log("logout error", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadSignup,
  signup,
  loadVerifyOtp,
  verifyOtp,
  loadLogin,
  login,
  logout,
};
