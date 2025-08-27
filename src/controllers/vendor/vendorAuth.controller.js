const formValidator = require("../../helpers/formValidator");
const Vendor = require("../../models/vendor/vendorSchema");
const otpControl = require("../../helpers/otpControl");
const passwordControl = require("../../helpers/passwordControl");

const loadSignup = (req, res) => {
  res.render("vendor/signup");
};

const signup = async (req, res) => {
  try {
    const { brandName, brandEmail, phoneNumber, password, confirmPassword } =
      req.body;
    console.log(req.body);
    //validation
    const errorMessage = formValidator.validateSignUp({
      name: brandName,
      email: brandEmail,
      phoneNumber,
      password,
      confirmPassword,
    });
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    // brand email already exists
    const findEmail = await Vendor.findOne({ brandEmail: brandEmail});
    if (findEmail) {
      return res.status(400).json({ message: "Brand email already exists" });
    }
    // phone number already exists
    const findPhone = await Vendor.findOne({ phoneNumber: phoneNumber });
    if (findPhone) {
      return res.status(400).json({ message: "Phone number already exists" });
    }
    // Generate OTP
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendVerificationEmail(brandEmail, otp);
    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }
    console.log("OTP sent", otp);
    //Pass word hash
    const hashedPassword = await passwordControl.securePassword(password);

    // Save OTP and vendor data in session
    req.session.vendorOtp = otp;
    req.session.vendorData = {brandEmail,brandName,phoneNumber,hashedPassword};
    req.session.otpExpires = Date.now() + 1 * 60 * 1000;

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      redirect: "/vendor/verify-otp",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const loadVerifyOtp = (req, res) => {
  // if (!req.session.vendorData) {
  //     return res.redirect('/vendor/signup');
  // }
  res.render("vendor/verifyOtp", { email: req.session.vendorData.brandEmail });
};

const verifyOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const fullOtp = `${otp1}${otp2}${otp3}${otp4}`.trim();
    console.log("enterd otp", fullOtp);
    //validate otp
    const errorMessage = formValidator.validateOtp(fullOtp);
    if (errorMessage) return res.status(400).json({ message: "Invalid Otp" });

    // Check if OTP and user session exist
    if (!req.session.vendorOtp || !req.session.vendorData) {
      return res
        .status(400)
        .json({ error: "Session expired. Please sign up again." });
    }

    // Check if OTP has expired
    if (Date.now() > req.session.otpExpires) {
      return res
        .status(400)
        .json({ error: "OTP has expired. Please request a new one." });
    }

    //compare OTP
    if (fullOtp == req.session.vendorOtp) {
      // Create new vendor
      const { brandName, brandEmail, phoneNumber, hashedPassword } = req.session.vendorData;
      const newVendor = new Vendor({
        brandName,
        brandEmail,
        phoneNumber,
        password: hashedPassword,
      });

      await newVendor.save();
      // Set user session
      req.session.vendor = newVendor._id;

      // Clear session data
      req.session.vendorOtp = null;
      req.session.vendorData = null;
      req.session.otpExpires = null;

      return res.status(200).json({
        success: true,
        message: "Vendor registered successfully",
        redirectUrl: "/vendor/login",
      });
      
    } else {
      return res.status(400).json({
        message: "Invalid OTP, please try again.",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while verifying OTP. Please try again.",
    });
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
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }
    
    //check data
    const vendor = await Vendor.findOne({ brandEmail: email });
    if (!vendor) {
      return res.status(400).json({ message: "Invalid credential" });
    }
    const isMatch = await passwordControl.comparePassword(password,vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credential" });
    }
    //check permission status
    if(vendor.permissionStatus=="pending"){
      return res.status(400).json({message:"Your registration is under review and awaiting administrator approval."});
    }
    if(vendor.permissionStatus=="rejected"){
      return res.status(400).json({message:"We regret to inform you that your account request has been rejected."});
    }

    //set session 
    req.session.vendor = vendor._id;

    return res.status(200).json({ success:true, redirectUrl: "/vendor/dashboard" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred during login. Please try again." });
  }
};



module.exports = {
  loadSignup,
  signup,
  loadVerifyOtp,
  verifyOtp,
  loadLogin,
  login,
};
