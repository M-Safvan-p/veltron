const Admin = require("../../models/admin/adminSchema");
const formValidator = require("../../helpers/formValidator");
const passwordControl = require("../../helpers/passwordControl");

const loadLogIn = (req, res) => {
  res.render("admin/login.ejs");
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    const errorMessage = formValidator.validateLogIn(email, password);
    if (errorMessage) {
      return res.status(400).json({ success: false, message: errorMessage });
    }

    //check admin
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await passwordControl.comparePassword(
      password,
      admin.password
    );
    if (!isMatch)return res.status(400).json({ success: false, message: "Invalid credentials" });
    
    //set session
    req.session.admin = true;
    return res
      .status(200)
      .json({ success: true, redirectUrl: "/admin/dashboard" });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during login. Please try again.",
    });
  }
};






module.exports = {
  loadLogIn,
  login,
};
