const express = require("express");
const router = express.Router();

const validate = require("../middleware/validate");
const couponSchema = require("../validators/admin/coupon");

const authController = require("../controllers/admin/adminAuth.controller");
const dashboardController = require("../controllers/admin/adminDashboard.controller");
const vendorController = require("../controllers/admin/adminVendor.controller");
const categoryController = require("../controllers/admin/adminCategory.controller");
const customerController = require("../controllers/admin/adminCustomer.controller");
const productController = require("../controllers/admin/adminProduct.controller");
const orderController = require("../controllers/admin/adminOrder.controller");
const couponController = require("../controllers/admin/adminCoupon.controller");
const saleController = require("../controllers/admin/adminSale.controller");

const { noCache } = require("../middleware/noCache");
const adminAuth = require("../middleware/adminAuth");

// Middleware to set admin layout
router.use((req, res, next) => {
  res.locals.layout = "layouts/adminLayout";
  next();
});
//application level no cache
router.use(noCache);

//  Auth
router.get("/", adminAuth.isLogin, authController.loadLogIn);
router.post("/", authController.login);
router.post("/logout", authController.logout);

//  Dashboard
router.get("/dashboard", adminAuth.checkSession, dashboardController.getDashboard);

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
router.patch("/category/:id", adminAuth.checkSession, categoryController.listAndUnlist);
router.get("/category/add-category", adminAuth.checkSession, categoryController.loadAddCategory);
router.post("/category/add-category", adminAuth.checkSession, categoryController.addCategory);
router.get("/category/edit-category/:id", adminAuth.checkSession, categoryController.loadEditCategory);
router.put("/category/edit-category/:id", adminAuth.checkSession, categoryController.editCategory);

//orders
router.get("/orders", adminAuth.checkSession, orderController.loadOrders);
router.get("/orders/:id", adminAuth.checkSession, orderController.loadOrderDetails);

//coupon
router.get("/coupons", adminAuth.checkSession, couponController.loadCoupons);
router.post("/coupons", adminAuth.checkSession, validate(couponSchema), couponController.addCoupon);
router.put("/coupons/:id", adminAuth.checkSession, validate(couponSchema), couponController.editCoupon);
router.patch("/coupons/:id", adminAuth.checkSession, couponController.listAndUnlist);

//sale
router.get("/sales", adminAuth.checkSession, saleController.loadSaleReport);
router.get("/sales/export/pdf", adminAuth.checkSession, saleController.exportPDF);
router.get("/sales/export/excel", adminAuth.checkSession, saleController.exportExcel);

//Page not found
router.use((req, res) => res.status(404).render("errors/admin404"));

module.exports = router;
