const express = require('express');
const router = express.Router();
const passport = require('passport');

//joi validation schemas
const validate = require('../middleware/validate');
const userSchema = require('../validators/user/userUpdate');
const passwordSchema = require('../validators/user/changePassword');
const addressSchema = require('../validators/user/address');

const upload = require('../config/multerConfig');

const { noCache } = require('../middleware/noCache');
const userAuth = require('../middleware/userAuth');

const authController = require('../controllers/user/userAuth.controller');
const pageController = require('../controllers/user/userPage.controller');
const productController = require('../controllers/user/userProduct.controller');
const profileController = require('../controllers/user/userProfile.controller');
const addressController = require('../controllers/user/userAddress.controller');
const cartController = require('../controllers/user/userCart.controller');

// Apply user layout to all user routes
router.use((req, res, next) => {
  res.locals.layout = 'layouts/userLayout';
  next();
});

// no cache
router.use(noCache)

//  no login Pages
router.get('/', userAuth.isLogin, pageController.loadLanding);
//product pages
router.get('/sale', productController.getProducts);
router.get('/sale/:id', productController.loadProductDetail);

// ----------------- Auth Routes -----------------
router.get('/signUp', userAuth.isLogin, authController.loadSignUp);
router.post('/signUp', authController.signUp);
router.get('/verifyOtp', userAuth.isLogin, authController.loadVerifyOtp);
router.post('/verifyOtp', authController.verifyOtp);
router.post('/resendOtp', authController.resendOtp);
router.get('/logIn', userAuth.isLogin, authController.loadLogIn);
router.post('/logIn', authController.logIn);
router.post('/logout', userAuth.checkSession, authController.logout);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signUp' }), (req, res) => {
  res.redirect('/home');
});

router.get('/forgotPassword', userAuth.isLogin, authController.loadForgotPassword);

// ----------------- Protected Pages -----------------
router.get('/home', userAuth.checkSession, pageController.loadHome);
//profile
router.get('/profile', userAuth.checkSession, profileController.loadProfile);
router.get('/profile/edit', userAuth.checkSession, profileController.loadProfileEdit);
router.post('/profile/edit', userAuth.checkSession, upload.single('profileImage'), validate(userSchema), profileController.profileEdit);
router.get('/profile/change-password', userAuth.checkSession, profileController.loadChangePassword);
router.put('/profile/change-password', userAuth.checkSession, validate(passwordSchema), profileController.changePassword);
router.get('/profile/change-email', userAuth.checkSession, profileController.loadChangeEmail);
router.post('/profile/change-email', userAuth.checkSession, profileController.veriryEmail);
router.put('/profile/verify-otp', userAuth.checkSession, profileController.verifyOtp);
// Address
router.get('/profile/address', userAuth.checkSession, addressController.loadAddress);
router.get('/profile/address/add', userAuth.checkSession, addressController.loadAddAddress);
router.post('/profile/address/add', userAuth.checkSession, validate(addressSchema), addressController.addAddress);
router.get('/profile/address/edit/:id', userAuth.checkSession, addressController.loadEditAddress);
router.put('/profile/address/edit/:id', userAuth.checkSession, validate(addressSchema), addressController.editAddress);
router.delete('/profile/address/:id', userAuth.checkSession, addressController.deleteAddress);
// Cart

router.get('/cart/', userAuth.checkSession, cartController.loadCart);
router.post('/cart/add', userAuth.checkSession, cartController.cartAdd);

//Page not found
router.use((req, res) => res.status(404).render('errors/404'));

module.exports = router;
