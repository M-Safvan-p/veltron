const express = require("express");
const router = express.Router();
const vendorAuthController = require("../controllers/vendor/vendorAuth.controller");
const vendorPageController = require("../controllers/vendor/vendorPage.controller");


router.get("/signup", vendorAuthController.loadSignup);
router.post("/signup", vendorAuthController.signup);
router.get("/verify-otp", vendorAuthController.loadVerifyOtp);
router.post("/verify-otp", vendorAuthController.verifyOtp);
router.get("/login", vendorAuthController.loadLogin);
router.post("/login", vendorAuthController.login);


//router.get("/home", vendorPageController.loadDashboard);

module.exports = router;
