const express = require("express");
const router = express.Router();

const authController = require("../controllers/admin/adminAuth.controller");
const dashboardController = require("../controllers/admin/adminDashboard.controller");
const vendorController = require("../controllers/admin/adminVendor.controller");
const categoryController = require("../controllers/admin/adminCategory.controller");
const customerController = require("../controllers/admin/adminCustomer.controller");
const productController = require("../controllers/admin/adminProduct.controller");

const { noCache } = require("../middleware/noCache");
const adminAuth = require("../middleware/adminAuth");

// Middleware to set admin layout
router.use((req, res, next) => {
  res.locals.layout = "layouts/adminLayout";
  next();
});
//application level no cache
router.use(noCache)

//  Auth 
router.get("/",  adminAuth.isLogin, authController.loadLogIn);
router.post("/", authController.login);
router.get("/logout", authController.logout);

//  Dashboard 
router.get("/dashboard", adminAuth.checkSession, dashboardController.loadDashboard);

//  Vendors 
router.get("/vendors", adminAuth.checkSession, vendorController.loadVendors);
router.get("/vendors/pendings", adminAuth.checkSession, vendorController.loadVendorsPendings);
router.patch("/vendors/:id", adminAuth.checkSession, vendorController.blockAndUnblock);
router.post("/vendors/pendings/approve", adminAuth.checkSession, vendorController.approveVendor);
router.post("/vendors/pendings/reject", adminAuth.checkSession, vendorController.cancelVendor);

// Product
router.get("/products", adminAuth.checkSession, productController.loadProducts);
router.patch("/products/:id", adminAuth.checkSession, productController.listAndUnlist);
router.get("/products/pendings", adminAuth.checkSession, productController.loadProductsPendings);
router.patch("/products/pendings/approve", adminAuth.checkSession, productController.approveProduct);
router.patch("/products/pendings/reject", adminAuth.checkSession, productController.rejectProduct);



//customers
router.get("/customers", adminAuth.checkSession, customerController.loadCustomers);
router.patch("/customers/:id", adminAuth.checkSession, customerController.blockAndUnblock);

//  Categories 
router.get("/category", adminAuth.checkSession, categoryController.loadCategory);
router.patch("/category/:id",adminAuth.checkSession, categoryController.listAndUnlist);
router.get("/category/add-category", adminAuth.checkSession, categoryController.loadAddCategory);
router.post("/category/add-category", adminAuth.checkSession, categoryController.addCategory);
router.get("/category/edit-category/:id", adminAuth.checkSession, categoryController.loadEditCategory);
router.put("/category/edit-category/:id", adminAuth.checkSession, categoryController.editCategory);

//Page not found
router.use((req,res)=>res.status(404).render("errors/admin404"))

module.exports = router;
