const express = require("express");
const router = express.Router();

const adminAuthController = require("../controllers/admin/adminAuth.controller")

// Middleware to set vendor layout
router.use((req, res, next) => {
    res.locals.layout = "layouts/adminLayout"; 
    next();
});


router.get("/login",adminAuthController.loadLogIn);
router.post("/login",adminAuthController.login);

router.get("/dashboard",adminAuthController.loadDashboard);
router.get("/vendors",adminAuthController.loadVendors);

router.get("/vendors/vendor-pendings",adminAuthController.loadVendorsPendings)
router.post("/vendors/vendor-pendings/approve",adminAuthController.approveVendor)
router.post("/vendors/vendor-pendings/cancel",adminAuthController.cancelVendor)



module.exports = router;