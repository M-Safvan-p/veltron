const express = require("express");
const router = express.Router();

const multer = require("multer");
const upload = require("../config/multerConfig");
const productSchema = require("../validators/vendor/productValidator");

const vendorAuth = require("../middleware/vendorAuth");
const { noCache } = require("../middleware/noCache");
const validate = require("../middleware/validate");

const authController = require("../controllers/vendor/vendorAuth.controller");
const pageController = require("../controllers/vendor/vendorPage.controller");
const productController = require("../controllers/vendor/vendorProduct.controller");
const orderController = require("../controllers/vendor/vendorOrder.controller");
const returnController = require("../controllers/vendor/vendorReturn.controller");

// Middleware to set vendor layout
router.use((req, res, next) => {
  res.locals.layout = "layouts/vendorLayout";
  next();
});
// no cache
router.use(noCache);
// Authentication routes
router.get("/signup", vendorAuth.isLogin, authController.loadSignup);
router.post("/signup", authController.signup);
router.get("/verify-otp", vendorAuth.isLogin, authController.loadVerifyOtp);
router.post("/verify-otp", authController.verifyOtp);
router.get("/", vendorAuth.isLogin, authController.loadLogin);
router.post("/", authController.login);
router.post("/logout", authController.logout);

router.get("/dashboard", vendorAuth.checkSession, pageController.loadDashboard);

//productss
router.get("/products", vendorAuth.checkSession, productController.loadProducts);
router.patch("/products/:id", vendorAuth.checkSession, productController.listAndUnlist);
router.get("/products/add-product", vendorAuth.checkSession, productController.loadAddProduct);
router.post("/products/add-product",vendorAuth.checkSession,upload.any(),validate(productSchema),productController.addProduct);
router.get("/products/edit-product/:id",vendorAuth.checkSession,productController.loadEditProduct);
router.put("/products/edit-product/:id",vendorAuth.checkSession,upload.any(),validate(productSchema),productController.editProduct);

//orders
router.get("/orders", vendorAuth.checkSession, orderController.loadOrders);
router.get("/orders/:id", vendorAuth.checkSession, orderController.loadOrderDetails);
router.put("/orders/:id/status", vendorAuth.checkSession, orderController.handleStatus);

// returns
router.get("/returns", vendorAuth.checkSession, returnController.loadReturns);
router.put("/returns/:id/status", vendorAuth.checkSession, returnController.updateReturnStatus);

// Add this after your routes
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large" });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Too many files" });
    }
  }

  if (error.message && error.message.includes("Invalid file type")) {
    return res.status(400).json({
      message: "Invalid image format. Allowed formats: jpg, png, jpeg, webp, heif, heic, svg",
    });
  }
  next(error);
});

//Page not found
router.use((req, res) => res.status(404).render("errors/vendor404"));

module.exports = router;
