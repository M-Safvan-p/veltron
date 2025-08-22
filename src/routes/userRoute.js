const express = require("express");
const router = express.Router();

const userAuthController = require("../controllers/user/userAuth.controller");
const userPageController = require("../controllers/user/userPage.controller");
const passport = require("passport");

// ----------------- Public Pages -----------------
router.get("/", userPageController.loadLanding);
router.get("/pageNotFound", userPageController.pageNotFound);

// ----------------- Auth Routes -----------------
router.get("/signUp", userAuthController.loadSignUp);
router.post("/signUp", userAuthController.signUp);
router.post("/verifyOtp",userAuthController.verifyOtp);
router.post("/resendOtp", userAuthController.resendOtp);

router.get("/logIn", userAuthController.loadLogIn);
router.post("/logIn", userAuthController.logIn);

router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect:"/signUp"}),(req,res)=>{
    res.redirect("/home")
})

router.get("/forgotPassword", userAuthController.loadForgotPassword);

// ----------------- Protected Pages -----------------
router.get("/home", userPageController.loadHome);

module.exports = router;
