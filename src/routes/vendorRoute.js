const express = require("express");
const router = express.Router();

const vendorAuth = require("../middleware/vendorAuth");
const {noCache} = require("../middleware/noCache");
const upload = require('../config/multerConfig');

const vendorAuthController = require("../controllers/vendor/vendorAuth.controller");
const vendorPageController = require("../controllers/vendor/vendorPage.controller");
const vendorProductController = require("../controllers/vendor/vendorProduct.controller");


// Middleware to set vendor layout
router.use((req, res, next) => {
    res.locals.layout = "layouts/vendorLayout"; 
    next();
});
// no cache
router.use(noCache)
// Authentication routes
router.get("/signup", vendorAuth.isLogin, vendorAuthController.loadSignup);
router.post("/signup", vendorAuthController.signup);
router.get("/verify-otp", vendorAuth.isLogin, vendorAuthController.loadVerifyOtp);
router.post("/verify-otp", vendorAuthController.verifyOtp);
router.get("/", vendorAuth.isLogin, vendorAuthController.loadLogin);
router.post("/", vendorAuthController.login);
router.get("/logout", vendorAuthController.logout);

router.get("/dashboard", vendorAuth.checkSession,vendorPageController.loadDashboard);


router.get("/products", vendorAuth.checkSession, vendorProductController.loadProducts);
router.get("/products/add-product", vendorAuth.checkSession,vendorProductController.loadAddProduct);
router.post("/products/add-product", vendorAuth.checkSession, upload.any(), vendorProductController.addProduct);

// Add this after your routes
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files' });
    }
  }
  next(error);
});

//Page not found
router.use((req,res)=>res.status(404).render("errors/vendor404"))

module.exports = router;
