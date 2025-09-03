const Vendor = require("../../models/vendor/vendorSchema");
const {success, error:errorResponse} = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const PermissionStatus = require("../../constants/permissionStatus");
const Messages = require("../../constants/messages");

const loadVendors = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 5;
    const skip = (page - 1) * limit;
    const vendors = await Vendor.find({ permissionStatus: PermissionStatus.APPROVED }).skip(skip).limit(limit);
    const totalVendors = await Vendor.countDocuments({permissionStatus:PermissionStatus.APPROVED});

    res.render("admin/vendors", {
      layout: "layouts/adminLayout",
      activePage: "vendors",
      admin:req.admin,
      vendors,
      totalVendors,
      currentPage:page,
      totalPages:Math.ceil(totalVendors / limit),
    });
  } catch (error) {
    console.log("Vendors page load Error",error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadVendorsPendings = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 5;
    const skip = (page - 1) * limit;
    const vendors = await Vendor.find({ permissionStatus: PermissionStatus.PENDING}).sort({createdAt:-1}).skip(skip).limit(limit);
    const totalVendors = await Vendor.countDocuments({permissionStatus:PermissionStatus.PENDING});

    res.render("admin/vendorsPendings", {
      layout: "layouts/adminLayout",
      activePage: "vendors",
      admin:req.admin,
      vendors,
      currentPage:page,
      totalVendors,
      totalPages:Math.ceil(totalVendors / limit)
    });
  } catch (error) {
    console.log("Vendors pending page load Error",error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.body;

    if (!vendorId) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VENDOR_ID_REQUIRED);

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return errorResponse(res, HttpStatus.NOT_FOUND, Messages.VENDOR_NOT_FOUND);

    vendor.permissionStatus = PermissionStatus.APPROVED;
    await vendor.save();
    success(res, HttpStatus.OK, Messages.VENDOR_APPROVED_SUCCESS);
  } catch (error) {
    console.error("Error approving vendor:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const cancelVendor = async (req,res)=>{
  try {
    const { vendorId} = req.body;
    if(!vendorId) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VENDOR_ID_REQUIRED);

    const vendor = await Vendor.findById(vendorId);
    if(!vendor)return errorResponse(res, HttpStatus.NOT_FOUND, Messages.VENDOR_NOT_FOUND);
    //cancel
    vendor.permissionStatus = PermissionStatus.REJECTED;
    await vendor.save();

    return success(res, HttpStatus.OK, Messages.VENDOR_REJECTED_SUCCESS);
  } catch (error) {
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
}

module.exports = {
    loadVendors,
    loadVendorsPendings,
    approveVendor,
    cancelVendor,
};