const express = require("express");
const router = express.Router();

const vendorAuth = require("../middleware/vendorAuth");
const {noCache} = require("../middleware/noCache");

const vendorAuthController = require("../controllers/vendor/vendorAuth.controller");
const vendorPageController = require("../controllers/vendor/vendorPage.controller");


// Middleware to set vendor layout
router.use((req, res, next) => {
    res.locals.layout = "layouts/vendorLayout"; 
    next();
});

router.get("/signup", noCache, vendorAuth.isLogin, vendorAuthController.loadSignup);
router.post("/signup", vendorAuthController.signup);
router.get("/verify-otp", noCache, vendorAuth.isLogin, vendorAuthController.loadVerifyOtp);
router.post("/verify-otp", vendorAuthController.verifyOtp);
router.get("/login", noCache,vendorAuth.isLogin, vendorAuthController.loadLogin);
router.post("/login", vendorAuthController.login);


router.get("/dashboard", vendorAuth.checkSession,vendorPageController.loadDashboard);

module.exports = router;
