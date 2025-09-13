const Admin = require("../../models/admin/adminSchema");
const formValidator = require("../../helpers/formValidator");
const passwordControl = require("../../helpers/passwordControl");
const HttpStatus = require("../../constants//statusCodes");
const Messages = require("../../constants/messages");
const {success, error:errorResponse} = require("../../helpers/responseHelper");

const loadLogIn = (req, res) => {
  res.render("admin/login.ejs");
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body; 
    //validation
    const errorMessage = formValidator.validateLogIn(email, password);
    if (errorMessage) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, errorMessage)
    }

    //check admin
    const admin = await Admin.findOne({ email });
    if (!admin) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_CREDENTIALS);
    const isMatch = await passwordControl.comparePassword(
      password,
      admin.password
    );
    if (!isMatch)return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_CREDENTIALS)
    
    //set session
    req.session.admin = true;
    return success(res, HttpStatus.OK, Messages.LOGIN_SUCCESS, {redirectUrl:"/admin/dashboard"} );  
  } catch (error) {
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const logout = (req,res)=>{
  try {
    req.session.admin=null;
    delete req.session.admin;
    res.clearCookie("connect.sid");
    res.setHeader('Cache-Control', 'no-store');
    success(res, HttpStatus.OK);
  } catch (error) {
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
}






module.exports = {
  loadLogIn,
  login,
  logout,
};
