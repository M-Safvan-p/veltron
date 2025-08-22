const express = require("express");
const router = express.Router();

const adminAuthController = require("../controllers/admin/adminAuth.controller")


router.get("/login",adminAuthController.loadLogIn);
router.post("/login",adminAuthController.login);
router.get("/dashboard",adminAuthController.loadDashboard)




module.exports = router;