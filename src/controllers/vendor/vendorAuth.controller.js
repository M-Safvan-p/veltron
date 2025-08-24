const formValidator = require("../../helpers/formValidator");
const Vendor = require("../../models/vendor/vendorSchema");
const otpControl = require("../../helpers/otpControl");
const passwordControl = require("../../helpers/passwordControl");
const { render } = require("ejs");

const loadSignup = (req, res) => {
  res.render("vendor/signup");
};

const signup = async (req, res) => {
  try {
    const { brandName, brandEmail, phoneNumber, password, confirmPassword } =
      req.body;
    //validation
    const errorMessage = formValidator.validateSignUp({
      name:brandName,
      email: brandEmail,
      phoneNumber,
      password,
      confirmPassword
  });
    if (errorMessage) {
      return res.status(400).json({ error: errorMessage });
    }

    // brand name already exists
    const findVendor = await Vendor.findOne({ brandName });
    if (findVendor) {
      return res.status(400).json({ error: "Brand name already exists" });
    }
    // brand email already exists
    const findEmail = await Vendor.findOne({ brandEmail });
    if (findEmail) {
      return res.status(400).json({ error: "Brand email already exists" });
    }
    // phone number already exists
    const findPhone = await Vendor.findOne({ phoneNumber: mobileNumber });
    if (findPhone) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    // Generate OTP
    const otp = otpControl.generateOTP();
    const emailSent = await otpControl.sendVerificationEmail(brandEmail, otp);
    if (!emailSent) {
      return res
        .status(500)
        .json({ error: "Failed to send verification email" });
    }

    // Save OTP and vendor data in session
    req.session.vendorOtp = otp;
    req.session.vendorData = { brandEmail, brandName, mobileNumber, password };
    req.session.otpExpires = Date.now() + 1 * 60 * 1000;

    return res.status(200).json({
      message: "OTP sent to your email",
      redirect: "/vendor/verify-otp",
    });
    console.log("otp sent", otp);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
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

    // Check if OTP and user session exist
    if (!req.session.vendorOtp || !req.session.vendorData) {
      return res.status(400).json({ error: "Session expired. Please sign up again." });
    }

    // Check if OTP has expired
    if (Date.now() > req.session.otpExpires) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    //compare OTP
    if(fullOtp == req.session.vendorOtp){
        // Create new vendor
        const { brandName, brandEmail, mobileNumber, password } = req.session.vendorData;
        const hashedPassword = await passwordControl.hashPassword(password);
        const newVendor = new Vendor({
            brandName,
            brandEmail,
            phoneNumber: mobileNumber,
            password: hashedPassword
        });
        await newVendor.save();

        // Clear session data
        req.session.vendorOtp = null;
        req.session.vendorData = null;
        req.session.otpExpires = null;

        return res.status(200).json({ message: "Vendor registered successfully", redirect: "/vendor/home" });
    }
  } catch (error) {}
};

const loadLogin = (req, res) => {
  res.render("vendor/login")
};

const login = async (req, res) => {
  try {
    const {email, password} = req.body;
    //validation
    const errorMessage = formValidator.validateLogIn(email,password)
    if(errorMessage){
      return res.status(400).json({error:errorMessage});
    }

    //check data
    const findVendor = await Vendor.findOne({email});
    if(!findVendor){
      return res.status(400).json({message:"Invalid credential"});
    }

    const isMatch = await passwordControl.comparePassword(password,findVendor.password)
    if(!isMatch){
      return res.status(400).json({message:"Invalid credential"});
    }

    return res.status(200).json({ redirectUrl: "/vendor/home"})

  } catch (error) {
      return res.status(500).json({message:"An error occurred during login. Please try again."})
  }
};

const loadHome = (req,res)=>{
  res.send("vendor home")
}

module.exports = {
  loadSignup,
  signup,
  loadVerifyOtp,
  verifyOtp,
  loadLogin,
  login,
  loadHome,
};
