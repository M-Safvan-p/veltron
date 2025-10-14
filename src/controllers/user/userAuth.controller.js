const User = require("../../models/user/userSchema");
const UserWallet = require("../../models/user/userWalletSchema");
const otpControl = require("../../helpers/otpControl");
const passwordControl = require("../../helpers/passwordControl");
const formValidator = require("../../helpers/formValidator");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");
const userQuery = require("../../helpers/userQuery");
const { message } = require("../../validators/user/userUpdate");

function loadSignUp(req, res) {
  try {
    return res.render("user/signUp", { message: null, old: {}, layout: false });
  } catch (error) {
    console.log("Signup page not loading " + error);
    res.status(500).send("Server Error");
  }
}

const signUp = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword, refferalCode } = req.body;
    console.log(req.body);

    // Validation
    const errorMessage = formValidator.validateSignUp({
      name: fullName,
      email,
      phoneNumber,
      password,
      confirmPassword,
    });
    if (errorMessage) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, errorMessage);
    }
    // Check email exists
    const findUser = await User.findOne({ email });
    if (findUser) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.USER_ALREADY_EXISTS);

    // Check phone exists
    const findPhone = await User.findOne({ phoneNumber });
    if (findPhone) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PHONE_ALREADY_EXISTS);

    // Check referral code
    if (refferalCode) {
      const refUser = await User.findOne({ referralCode: refferalCode.trim() });
      if (!refUser) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.REFERRAL_CODE_INVALID);
      req.session.referredBy = refUser._id;
    }
    // Generate OTP and send email
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendVerificationEmail(email, otp);

    if (!emailSent) return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.OTP_SEND_FAILED);
    console.log("OTP sent", otp);
    // Hash password
    const passwordHash = await passwordControl.securePassword(password);

    // Save OTP & user data in session
    req.session.userOtp = otp;
    req.session.userData = { fullName, email, phoneNumber, passwordHash };
    req.session.otpExpiry = Date.now() + 1 * 60 * 1000; // OTP valid for 1 minute

    return success(res, HttpStatus.OK, Messages.SIGNUP_SUCCESS, {
      redirect: "/verifyOtp",
    });
  } catch (error) {
    console.error("Signup error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadVerifyOtp = (req, res) => {
  if (!req.session.userData) {
    return res.redirect("/signUp");
  }
  res.render("user/verifyOtp", {
    email: req.session.userData.email,
    layout: false,
  });
};

const verifyOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const fullOtp = `${otp1}${otp2}${otp3}${otp4}`.trim();
    console.log("User entered OTP:", fullOtp);
    //validate otp
    const errorMessage = formValidator.validateOtp(fullOtp);
    if (errorMessage) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_INVALID);

    // Check if OTP and user session exist
    if (!req.session.userOtp || !req.session.userData) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_EXPIRED);

    // Check if OTP has expired
    if (Date.now() > req.session.otpExpiry) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_EXPIRED);

    // Compare OTP
    if (fullOtp !== req.session.userOtp) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_INVALID);

    // Generate referral code
    const newReferralCode = (fullName) => {
      const random = Math.floor(1000 + Math.random() * 9000);
      return fullName.slice(0, 4).toUpperCase() + random;
    };

    // Link referred by user
    const referredBy = req.session.referredBy || null;
    if (referredBy) {
      const refUser = await User.findById(referredBy);
      if (refUser) {
        refUser.referredUsers.push(req.session.userData._id);
        await refUser.save();
      }
      const referredByWallet = await UserWallet.findOne({ userId: referredBy });
      if (referredByWallet) {
        referredByWallet.balance += 500;
        referredByWallet.transactionHistory.push({
          type: "credit",
          amount: 500,
          message: `Referral bonus for referring ${req.session.userData.fullName}`,
        });
        await referredByWallet.save();
      }
    }

    // Save user in DB
    const userData = req.session.userData;
    const saveUserData = new User({
      fullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.passwordHash,
      authProvider: "local",
      referralCode: newReferralCode(userData.fullName),
    });
    await saveUserData.save();

    //if referred give 200
    if (referredBy) {
      const newWallet = new UserWallet({
        userId: saveUserData._id,
        balance: 200,
        transactionHistory: [
          {
            type: "credit",
            amount: 200,
            message: "Welcome bonus for using referral code",
          },
        ],
      });
      await newWallet.save();
      saveUserData.wallet = newWallet._id;
      await saveUserData.save();
    } else {
      const newWallet = new UserWallet({
        userId: saveUserData._id,
        balance: 0,
        transactionHistory: [],
      });
      await newWallet.save();
      saveUserData.wallet = newWallet._id;
      await saveUserData.save();
    }
    // Set user session
    req.session.user = saveUserData._id.toString();

    // Clear OTP from session
    delete req.session.referredBy;
    delete req.session.userOtp;
    delete req.session.otpExpiry;
    delete req.session.userData;

    return success(res, HttpStatus.OK, Messages.OTP_VERIFIED, {
      redirectUrl: "/home",
    });
  } catch (error) {
    console.log("OTP Verification Error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.session?.userData?.email || req.session?.userEmail;
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendVerificationEmail(email, otp);
    console.log("resend otp", otp);

    if (!emailSent) return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.EMAIL_SEND_FAILED);

    req.session.userOtp = otp;
    req.session.otpExpiry = Date.now() + 1 * 60 * 1000;

    return success(res, HttpStatus.OK, Messages.OTP_RESENT);
  } catch (error) {
    console.error("Error resending OTP:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadLogIn = (req, res) => {
  try {
    return res.render("user/logIn", { message: null, layout: false });
  } catch (error) {
    console.log("login page not loading ", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    // backend validation
    const errorMessage = formValidator.validateLogIn(email, password);
    if (errorMessage) return errorResponse(res, HttpStatus.BAD_REQUEST, errorMessage);
    // Find user
    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.LOGIN_USER_NOT_FOUND);
    //check google auth
    if (user.authProvider === "google") return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.GOOGLE_AUTH_USER);
    // Check password
    const isMatch = await passwordControl.comparePassword(password, user.password);
    if (!isMatch) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_CREDENTIALS);
    // check block
    if (user.isBlocked) return errorResponse(res, HttpStatus.FORBIDDEN, Messages.USER_BLOCKED);

    // Set session
    req.session.user = user._id;

    return success(res, HttpStatus.OK, Messages.LOGIN_SUCCESS, {
      redirectUrl: "/home",
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.INTERNAL_SERVER_ERROR);
  }
};

const loadForgotPassword = (req, res) => {
  try {
    return res.render("user/forgotPassword", { layout: false });
  } catch (error) {
    console.log("Forgot page load Error:", error);
    return res.errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await userQuery.getUser({ email });
    if (!user) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_EMAIL);
    // otp
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendForgotPasswordOtp(email, otp);
    if (!emailSent) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_SEND_FAILED);

    req.session.userOtp = otp;
    req.session.userEmail = email;
    console.log("otp :", otp);

    success(res, HttpStatus.OK, Messages.OTP_SENT_SUCCESS);
  } catch (error) {
    console.log("verify email error ", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadForgotOtp = async (req, res) => {
  try {
    const email = req.session.userEmail;
    res.render("user/forgotOtp", {
      email,
      layout: false,
    });
  } catch (error) {
    console.log("load otp page error", error);
    res.redirect("/forgotPassword");
  }
};

const forgotOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const fullOtp = `${otp1}${otp2}${otp3}${otp4}`.trim();
    console.log("User entered OTP:", fullOtp);
    // validate otp
    const errorMessage = formValidator.validateOtp(fullOtp);
    if (errorMessage) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_INVALID);

    const otp = req.session.userOtp;
    if (otp != fullOtp) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.OTP_INVALID);
    return success(res, HttpStatus.OK, "", { redirectUrl: "/forgotPassword/newPassword" });
  } catch (error) {
    console.log("forgot otp error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadNewPassword = async (req, res) => {
  try {
    res.render("user/newPassword", {
      layout: false,
    });
  } catch (error) {
    console.log("new pass load error", error);
    res.redirect("/login");
  }
};

const newPassword = async (req, res) => {
  try {
    const email = req.session.userEmail;
    const { newPassword, confirmPassword } = req.body;
    // validation
    if (!newPassword || !confirmPassword) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VALIDATION_BOTH_FIELD_REQUIRED);
    }
    if (newPassword.length < 8) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VALIDATION_PASSWORD_LENGTH);
    }
    if (newPassword !== confirmPassword) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VALIDATION_PASSWORD_MISMATCH);
    }
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VALIDATION_PASSWORD_STRENGTH);
    }

    //update
    const hashedPassword = await passwordControl.securePassword(newPassword);
    await User.findOneAndUpdate({ email: email }, { password: hashedPassword });
    success(res, HttpStatus.OK);
  } catch (error) {
    console.error("New password error:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const logout = (req, res) => {
  try {
    req.session.user = null;
    delete req.session.user;
    res.clearCookie("connect.sid");
    res.setHeader("Cache-Control", "no-store");
    success(res, HttpStatus.OK);
  } catch (error) {
    console.log("logout ", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadSignUp,
  signUp,
  loadVerifyOtp,
  verifyOtp,
  resendOtp,
  loadLogIn,
  logIn,
  loadForgotPassword,
  forgotPassword,
  loadForgotOtp,
  forgotOtp,
  loadNewPassword,
  newPassword,
  logout,
};
