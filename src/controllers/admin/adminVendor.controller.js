
const Vendor = require("../../models/vendor/vendorSchema");

const loadVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ permissionStatus: "approved" });

    console.log("all vendors:", vendors);
    console.log(req.admin);

    res.render("admin/vendors", {
      layout: "layouts/adminLayout",
      activePage: "vendors",
      admin:req.admin,
      vendors,
    });
  } catch (error) {}
};

const loadVendorsPendings = async (req, res) => {
  try {
    const vendors = await Vendor.find({ permissionStatus: "pending" })

    console.log("all vendors", vendors);

    res.render("admin/vendorsPendings", {
      layout: "layouts/adminLayout",
      activePage: "vendors",
      admin:req.admin,
      vendors,
    });
  } catch (error) {}
};

const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.permissionStatus = "approved";
    await vendor.save();

    return res.status(200).json({ message: "Vendor approved successfully" });
  } catch (error) {
    console.error("Error approving vendor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const cancelVendor = async (req,res)=>{
  try {
    const { vendorId} = req.body;
    if(!vendorId)return res.status(400).json({message:"Vendor ID is required"});

    const vendor = await Vendor.findById(vendorId);
    if(!vendor)return res.status(400).json({message:"Vendor not found"});
    //cancel
    vendor.permissionStatus = "rejected";
    await vendor.save();

    return res.status(200).json({message:"Vendor rejected successfully"});
  } catch (error) {
    return res.status(500).json({message:"Internal server error"})
  }
}

module.exports = {
    loadVendors,
    loadVendorsPendings,
    approveVendor,
    cancelVendor,
};