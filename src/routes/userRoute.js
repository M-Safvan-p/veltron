const express = require("express");
const router = express.Router();

const validate = require("../middleware/validate");
const userSchema = require("../validators/user/userUpdate");
const passwordSchema = require("../validators/user/changePassword");

const upload = require("../config/multerConfig");

const { noCache } = require("../middleware/noCache");
const userAuth = require("../middleware/userAuth");

const authController = require("../controllers/user/userAuth.controller");
const pageController = require("../controllers/user/userPage.controller");
const productController = require("../controllers/user/userProduct.controller");
const profileController = require("../controllers/user/userProfile.controller")

const passport = require("passport");

// Apply user layout to all user routes
router.use((req, res, next) => {
  res.locals.layout = "layouts/userLayout";
  next();
});


//  nologin Pages 
router.get("/", userAuth.isLogin, pageController.loadLanding);
//product pages
router.get("/sale", productController.getProducts);
router.get("/sale/:id", productController.loadProductDetail);

// ----------------- Auth Routes -----------------
router.get("/signUp", userAuth.isLogin, noCache, authController.loadSignUp);
router.post("/signUp", authController.signUp);
router.get("/verifyOtp", userAuth.isLogin, noCache, authController.loadVerifyOtp)
router.post("/verifyOtp", authController.verifyOtp);
router.post("/resendOtp", authController.resendOtp);

router.get("/logIn", userAuth.isLogin, noCache, authController.loadLogIn);
router.post("/logIn", authController.logIn);

router.get("/auth/google",noCache,passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/signUp" }),(req, res) => {
    res.redirect("/home");
  }
);

router.get("/forgotPassword", userAuth.isLogin, noCache, authController.loadForgotPassword);

// ----------------- Protected Pages -----------------
router.get("/home", userAuth.checkSession, pageController.loadHome);
router.get("/profile", userAuth.checkSession, profileController.loadProfile);
router.get("/profile/edit", userAuth.checkSession, profileController.loadProfileEdit);
router.post("/profile/edit", userAuth.checkSession, upload.single("profileImage"), validate(userSchema), profileController.profileEdit);
router.get("/profile/change-password", userAuth.checkSession, profileController.loadChangePassword);
router.put("/profile/change-password", userAuth.checkSession, validate(passwordSchema), profileController.changePassword);
















//Page not found
router.use((req,res)=>res.status(404).render("errors/404"))

module.exports = router;
