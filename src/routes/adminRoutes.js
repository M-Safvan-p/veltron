const express = require("express");
const router = express.Router();

const authController = require("../controllers/admin/adminAuth.controller");
const dashboardController = require("../controllers/admin/adminDashboard.controller");
const vendorController = require("../controllers/admin/adminVendor.controller");
const categoryController = require("../controllers/admin/adminCategory.controller");

const { noCache } = require("../middleware/noCache");
const adminAuth = require("../middleware/adminAuth");

// Middleware to set admin layout
router.use((req, res, next) => {
  res.locals.layout = "layouts/adminLayout";
  next();
});

// ---------- Auth ----------
router.get("/login", noCache, adminAuth.isLogin, authController.loadLogIn);
router.post("/login", authController.login);

// ---------- Dashboard ----------
router.get("/dashboard", adminAuth.checkSession, dashboardController.loadDashboard);

// ---------- Vendors ----------
router.get("/vendors", adminAuth.checkSession, vendorController.loadVendors);
router.get("/vendors/pendings", adminAuth.checkSession, vendorController.loadVendorsPendings);
router.post("/vendors/pending/approve", adminAuth.checkSession, vendorController.approveVendor);
router.post("/vendors/pending/reject", adminAuth.checkSession, vendorController.cancelVendor);

// ---------- Categories ----------
router.get("/category", adminAuth.checkSession, categoryController.loadCategory);
router.get("/category/add-category", adminAuth.checkSession, categoryController.addCategory);
router.post("/category/add-category", adminAuth.checkSession, categoryController.addCategory);

module.exports = router;
