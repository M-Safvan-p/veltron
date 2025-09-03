const express = require("express");
const router = express.Router();

const userAuthController = require("../controllers/user/userAuth.controller");
const userPageController = require("../controllers/user/userPage.controller");
const { noCache } = require("../middleware/noCache");
const passport = require("passport");

// ----------------- Public Pages -----------------
router.get("/", userPageController.loadLanding);
router.get("/pageNotFound", userPageController.pageNotFound);

// ----------------- Auth Routes -----------------
router.get("/signUp", noCache, userAuthController.loadSignUp);
router.post("/signUp", userAuthController.signUp);
router.get("/verifyOtp", noCache, userAuthController.loadVerifyOtp)
router.post("/verifyOtp", userAuthController.verifyOtp);
router.post("/resendOtp", userAuthController.resendOtp);

router.get("/logIn", noCache, userAuthController.loadLogIn);
router.post("/logIn", userAuthController.logIn);

router.get("/auth/google",noCache,passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/signUp" }),(req, res) => {
    res.redirect("/home");
  }
);

router.get("/forgotPassword", noCache, userAuthController.loadForgotPassword);

// ----------------- Protected Pages -----------------
router.get("/home", userPageController.loadHome);
//Page not found
router.use((req,res)=>res.status(404).render("errors/404"))

module.exports = router;
