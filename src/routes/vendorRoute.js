const express = require("express");
const router = express.Router();

const multer = require('multer');
const upload = require('../config/multerConfig');
const productSchema = require("../validators/vendor/productValidator");

const vendorAuth = require("../middleware/vendorAuth");
const {noCache} = require("../middleware/noCache");
const validate = require("../middleware/validate");

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

//productss
router.get("/products", vendorAuth.checkSession, vendorProductController.loadProducts);
router.patch("/products/:id", vendorAuth.checkSession, vendorProductController.listAndUnlist);
router.get("/products/add-product", vendorAuth.checkSession,vendorProductController.loadAddProduct);
router.post("/products/add-product", vendorAuth.checkSession, upload.any(), validate(productSchema), vendorProductController.addProduct);
router.get("/products/edit-product/:id", vendorAuth.checkSession, vendorProductController.loadEditProduct);
router.put("/products/edit-product/:id", vendorAuth.checkSession, upload.any(), validate(productSchema), vendorProductController.editProduct);




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

  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({ message:'Invalid image format. Allowed formats: jpg, png, jpeg, webp, heif, heic, svg' });
  }
  next(error);
});


//Page not found
router.use((req,res)=>res.status(404).render("errors/vendor404"))

module.exports = router;
