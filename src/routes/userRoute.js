const express = require("express");
const router = express.Router();
const passport = require("passport");

const upload = require("../config/multerConfig");

const { noCache } = require("../middleware/noCache");
const userAuth = require("../middleware/userAuth");
const cartAuth = require("../middleware/cartAuth");
const validate = require("../middleware/validate");

const userSchema = require("../validators/user/userUpdate");
const passwordSchema = require("../validators/user/changePassword");
const addressSchema = require("../validators/user/address");
const forgotSchema = require("../validators/user/forgotPassword");
const contactSchema = require("../validators/user/contact");

const authController = require("../controllers/user/userAuth.controller");
const pageController = require("../controllers/user/userPage.controller");
const productController = require("../controllers/user/userProduct.controller");
const profileController = require("../controllers/user/userProfile.controller");
const addressController = require("../controllers/user/userAddress.controller");
const cartController = require("../controllers/user/userCart.controller");
const orderController = require("../controllers/user/userOrder.controller");
const invoiceController = require("../controllers/user/userInvoice.controller");
const walletController = require("../controllers/user/userWallet.controller");
const wishlistController = require("../controllers/user/userWishlist.controller");
const cancelAndReturnController = require("../controllers/user/cancelAndReturn.controller");


// Apply user layout to all user routes
router.use((req, res, next) => { 
  res.locals.layout = "layouts/userLayout";
   next(); 
  });
router.use(noCache);

//  Public Pages 
router.get("/", userAuth.isLogin, pageController.loadLanding);
router.get("/sale", productController.getProducts);
router.get("/product/:id", productController.loadProductDetail);
router.get("/about",pageController.loadAbout);
router.get("/contact",pageController.loadContact);
router.post("/contact/submit", validate(contactSchema), pageController.postContact);

//  Auth Routes 
router.get("/signUp", userAuth.isLogin, authController.loadSignUp);
router.post("/signUp", authController.signUp);
router.get("/verifyOtp", userAuth.isLogin, authController.loadVerifyOtp);
router.post("/verifyOtp", authController.verifyOtp);
router.post("/resendOtp", authController.resendOtp);
router.get("/logIn", userAuth.isLogin, authController.loadLogIn);
router.post("/logIn", authController.logIn);
router.post("/logout", userAuth.checkSession, authController.logout);
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=google", failureMessage: true }),
  (req, res) => { req.session.user = req.user._id; res.redirect("/home"); }
);
router.get("/forgotPassword", userAuth.isLogin, authController.loadForgotPassword);
router.post("/forgotPassword", userAuth.isLogin, authController.forgotPassword);
router.get("/forgotPassword/verify", userAuth.isLogin, authController.loadForgotOtp);
router.post("/forgotPassword/verify", userAuth.isLogin, authController.forgotOtp);
router.get("/forgotPassword/newPassword", userAuth.isLogin, authController.loadNewPassword);
router.post("/forgotPassword/newPassword", userAuth.isLogin, authController.newPassword);


// Pages 
router.get("/home", userAuth.checkSession, pageController.loadHome);

//  Profile 
router.get("/profile", userAuth.checkSession, profileController.loadProfile);
router.get("/profile/edit", userAuth.checkSession, profileController.loadProfileEdit);
router.post("/profile/edit", userAuth.checkSession, upload.single("profileImage"), validate(userSchema), profileController.profileEdit);
router.get("/profile/change-password", userAuth.checkSession, profileController.loadChangePassword);
router.put("/profile/change-password", userAuth.checkSession, validate(passwordSchema), profileController.changePassword);
router.get("/profile/forgot-password", userAuth.checkSession, profileController.loadForgotPassword);
router.post("/profile/forgot-password", userAuth.checkSession, validate(forgotSchema), profileController.forgotPassword);
router.get("/profile/change-email", userAuth.checkSession, profileController.loadChangeEmail);
router.post("/profile/change-email", userAuth.checkSession, profileController.veriryEmail);
router.put("/profile/verify-otp", userAuth.checkSession, profileController.verifyOtp);
// Referral
router.get("/profile/referral", userAuth.checkSession, pageController.loadReferral);

//  Address 
router.get("/profile/address", userAuth.checkSession, addressController.loadAddress);
router.get("/profile/address/add", userAuth.checkSession, addressController.loadAddAddress);
router.post("/profile/address/add", userAuth.checkSession, validate(addressSchema), addressController.addAddress);
router.get("/profile/address/edit/:id", userAuth.checkSession, addressController.loadEditAddress);
router.put("/profile/address/edit/:id", userAuth.checkSession, validate(addressSchema), addressController.editAddress);
router.patch("/profile/address/:id", userAuth.checkSession, addressController.setDefaultAddress);
router.delete("/profile/address/:id", userAuth.checkSession, addressController.deleteAddress);

//  Cart 
router.get("/cart", userAuth.checkSession, cartController.loadCart);
router.post("/cart/add", cartAuth.cartSession, cartController.cartAdd);
router.post("/cart/remove/:id", userAuth.checkSession, cartController.cartRemove);
router.post("/cart/empty", userAuth.checkSession, cartController.cartEmpty);
router.post("/cart/increase/:id", cartAuth.cartSession, cartController.cartIncrease);
router.post("/cart/decrease/:id", cartAuth.cartSession, cartController.cartDecrease);

//  place Order 
router.get("/checkout", userAuth.checkSession, orderController.loadCheckout);
router.post("/checkout/place-order", userAuth.checkSession, orderController.placeOrder);
router.post("/checkout/apply-coupon", userAuth.checkSession, orderController.applyCoupon);
router.post("/checkout/place-order/razorpay-verify", userAuth.checkSession, orderController.razorpayVerify );
// view order
router.get("/profile/orders", userAuth.checkSession, cancelAndReturnController.loadorders);
router.get("/profile/orders/invoice/:id", userAuth.checkSession, invoiceController.generateInvoice);
router.get("/profile/orders/:id", userAuth.checkSession, cancelAndReturnController.loadOrderDetails);
router.put("/profile/orders/:id/cancel-items", userAuth.checkSession, cancelAndReturnController.cancelOrder);
//return 
router.post("/profile/orders/:id/return-items", userAuth.checkSession, cancelAndReturnController.returnRequest);

//walllet
router.get("/profile/wallet", userAuth.checkSession, walletController.loadWallet);
router.post("/profile/wallet/create-order", userAuth.checkSession, walletController.createWalletOrder);
router.post("/profile/wallet/verify-payment", userAuth.checkSession, walletController.verifyWalletPayment);

// wishlist 
router.get("/profile/wishlist", userAuth.checkSession, wishlistController.loadWishlist);
router.post("/wishlist/add", cartAuth.cartSession, wishlistController.addToWishlist);
router.delete("/wishlist/remove/:productId/:variantId", userAuth.checkSession, wishlistController.removeFromWishlist);

//  404 Page 
router.use((req, res) => res.status(404).render("errors/404"));

module.exports = router;
