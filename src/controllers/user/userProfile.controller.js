const User = require('../../models/user/userSchema');
const { success, error: errorResponse } = require('../../helpers/responseHelper');
const Messages = require('../../constants/messages');
const HttpStatus = require('../../constants/statusCodes');
const passwordControl = require("../../helpers/passwordControl")

const loadProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user).lean();
    res.render('user/profile', {
      layout: 'layouts/userLayout',
      user,
      currentPage: 'profile',
    });
  } catch (error) {
    console.log('user profile load error', error);
    res.redirect('/user/home');
  }
};

const loadProfileEdit = async (req, res) => {
  try {
    const user = await User.findById(req.session.user).lean();
    res.render('user/profileEdit', {
      layout: 'layouts/userLayout',
      user,
      currentPage: 'profile',
    });
  } catch (error) {
    console.log('user profile load error', error);
    res.redirect('/user/profile');
  }
};

const profileEdit = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.file);

    const userId = req.session.user;
    const { fullName, phoneNumber } = req.body;

    const phoneNO = await User.findOne({ _id: { $ne: userId }, phoneNumber: phoneNumber });
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

    console.log('Profile updated successfully');
    return success(res, HttpStatus.OK, Messages.USER_UPDATE_SUCCESS);
  } catch (error) {
    console.log('Profile edit error:', error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.USER_UPDATE_ERROR);
  }
};

const loadChangePassword = async (req, res) => {
    try {
        const user = await User.findById(req.session.user)
        res.render('user/changePassword', {
          layout: 'layouts/userLayout',
          currentPage: 'change-password',
          user
        });
    } catch (error) {
        console.log("change passwore error:", error);
        res.redirect("/profile");
    }
};

const changePassword = async (req,res) => {
    try {
        const user = await User.findById(req.session.user);
        const { currentPassword, newPassword, confirmPassword } = req.body;
        // current password check
        const checkCurrent = await passwordControl.comparePassword(currentPassword, user.password);
        if(!checkCurrent) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.WRONG_CURRENT_PASSWORD);
        // HASH
        const newHashedPassword = await passwordControl.securePassword(newPassword);
        //update
        await User.findByIdAndUpdate(user.id,{password:newHashedPassword});

        success(res, HttpStatus.OK, Messages.UPDATE_SUCCESS_PASSWORD);
    } catch (error) {
        console.log("Error in password updating", error);
        errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
    }
}







module.exports = {
  loadProfile,
  loadProfileEdit,
  profileEdit,
  loadChangePassword,
  changePassword,
};
