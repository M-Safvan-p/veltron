const User = require("../../models/user/userSchema");
const otpControl = require("../../helpers/otpControl");
const passwordControl = require("../../helpers/passwordControl");
const formValidator = require("../../helpers/formValidator");


function loadSignUp(req, res) {
  try {
    return res.render("user/signUp", { message: null, old: {} });
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
      return res.status(400).json({ message: errorMessage });
    }
    // Check email exists
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Check phone exists
    const findPhone = await User.findOne({ phoneNumber });
    if (findPhone) {
      return res.status(400).json({ message: "Phone number already exists" });
    }
    // Generate OTP and send email
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send verification email" });
    }
    console.log("OTP sent", otp);
    // Hash password
    const passwordHash = await passwordControl.securePassword(password);

    // Save OTP & user data in session
    req.session.userOtp = otp;
    req.session.userData = { fullName, email, phoneNumber, passwordHash };
    req.session.otpExpiry = Date.now() + 1 * 60 * 1000; // OTP valid for 1 minute

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      redirect: "/verifyOtp"
    });

  } catch (error) {
    console.error("Signup error", error);
    res.status(500).json({ message: "Server error" });
  }
};

const loadVerifyOtp = (req, res) => {
  if (!req.session.userData) {
      return res.redirect('/signUp');
  }
  res.render("user/verifyOtp",{email:req.session.userData.email});
};


const verifyOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const fullOtp = `${otp1}${otp2}${otp3}${otp4}`.trim();
    console.log("User entered OTP:", fullOtp);
    //validate otp 
    const errorMessage = formValidator.validateOtp(fullOtp);
    if(errorMessage)return res.status(400).json({message:"Invalid Otp"})

    // Check if OTP and user session exist
    if (!req.session.userOtp || !req.session.userData) {
      return res.json({
        success: false,
        message: "Session expired or invalid. Please request a new OTP.",
      });
    }

    // Check if OTP has expired
    if (Date.now() > req.session.otpExpiry) {
      return res.json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    // Compare OTP
    if (fullOtp === req.session.userOtp) {
      const userData = req.session.userData;
      

      // Save user in DB
      const saveUserData = new User({
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        password: userData.passwordHash,
      });

      await saveUserData.save();

      // Set user session
      req.session.user = saveUserData._id;

      // Clear OTP from session
      delete req.session.userOtp;
      delete req.session.otpExpiry;
      delete req.session.userData;

      return res.status(200).json({ success: true, redirectUrl: "/home" });
    } else {
      return res.json({
        success: false,
        message: "Invalid OTP, please try again.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying OTP. Please try again.",
    });
  }
};

const resendOtp = async (req,res) => {
  try {
    // Make sure we still have user data in session
    if (!req.session.userData) {
      return res.json({
        success: false,
        message: "Session expired. Please register again.",
      });
    }
    const {email} = req.session.userData;
    const otp = otpControl.generateOtp();
    const emailSent = await otpControl.sendVerificationEmail(email, otp);
    console.log("resend otp",otp)
    if (!emailSent) {
      return res.json({success:false, message:"email-error"});;
    }

    req.session.userOtp = otp;
    req.session.otpExpiry = Date.now() + 1 * 60 * 1000;

    return res.json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Could not resend OTP. Please try again later.",
    });
  }
  
}

const loadLogIn = (req, res) => {
  try {
    return res.render("user/logIn", { message: null });
  } catch (error) {
    console.log("login page not loading " + error);
    res.status(500).send("Server Error");
  }
};

const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    // backend validation
    const errorMessage = formValidator.validateLogIn(email, password);
    if (errorMessage) {
      return res.status(400).json({ success: false, message: errorMessage });
    }
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
    }
    // Check password
    const isMatch = await passwordControl.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password." });
    }
    // Set session and respond
    req.session.user = user._id;

    return res.status(200).json({ success: true, redirectUrl: "/home" });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};


const loadForgotPassword = (req, res) => {
  try {
    return res.render("user/forgotPassword");
  } catch (error) {
    console.log("Signup page not loading " + error);
    res.status(500).send("Server Error");
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
};
