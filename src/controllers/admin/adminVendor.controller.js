const Vendor = require("../../models/vendor/vendorSchema");
const { success, error: errorResponse } = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const PermissionStatus = require("../../constants/permissionStatus");
const Messages = require("../../constants/messages");

const loadVendors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "";

    // Build match stage
    const matchStage = {
      permissionStatus: PermissionStatus.APPROVED,
    };

    if (search) {
      matchStage.brandName = { $regex: search, $options: "i" };
    }

    if (status === "active") matchStage.isBlocked = false;
    if (status === "blocked") matchStage.isBlocked = true;

    // Build sort stage
    let sortStage = { createdAt: -1 };
    if (sort === "name-asc") sortStage = { brandName: 1 };
    if (sort === "name-desc") sortStage = { brandName: -1 };
    if (sort === "sales-high") sortStage = { totalSales: -1 };
    if (sort === "sales-low") sortStage = { totalSales: 1 };

    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "orders",
          let: { vendorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$orderStatus", "completed"] },
              },
            },
            {
              $unwind: "$products",
            },
            {
              $match: {
                $expr: { $eq: ["$products.vendorId", "$$vendorId"] },
              },
            },
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: "$products.vendorEarning" },
                totalOrders: { $sum: 1 },
              },
            },
          ],
          as: "salesData",
        },
      },
      {
        $addFields: {
          sales: {
            $cond: [{ $gt: [{ $size: "$salesData" }, 0] }, { $arrayElemAt: ["$salesData.totalEarnings", 0] }, 0],
          },
          orderCount: {
            $cond: [{ $gt: [{ $size: "$salesData" }, 0] }, { $arrayElemAt: ["$salesData.totalOrders", 0] }, 0],
          },
          totalSales: {
            $cond: [{ $gt: [{ $size: "$salesData" }, 0] }, { $arrayElemAt: ["$salesData.totalEarnings", 0] }, 0],
          },
        },
      },
      {
        $project: {
          salesData: 0, // Remove the lookup array
        },
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ];

    // Get total count for pagination
    const countPipeline = [{ $match: matchStage }];

    const vendors = await Vendor.aggregate(pipeline);
    const countResult = await Vendor.aggregate(countPipeline);
    const totalVendors = countResult.length;

    res.render("admin/vendors", {
      layout: "layouts/adminLayout",
      activePage: "vendors",
      admin: req.admin,
      vendors,
      totalVendors,
      currentPage: page,
      totalPages: Math.ceil(totalVendors / limit),
      query: req.query,
    });
  } catch (error) {
    console.log("Vendors page load Error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const blockAndUnblock = async (req, res) => {
  try {
    const id = req.params.id;
    const isBlocked = req.body.isBlocked === true || req.body.isBlocked === "true";
    //find
    const vendor = Vendor.findById(id);
    if (!vendor) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VENDOR_NOT_FOUND);
    //change
    await vendor.findByIdAndUpdate(id, { isBlocked });
    //session clear if login
    req.session.vendor = null;
    delete req.session.vendor;
    return success(res, HttpStatus.OK);
  } catch (error) {
    console.log("block and unblock ", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadVendorsPendings = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 5;
    const skip = (page - 1) * limit;
    const vendors = await Vendor.find({
      permissionStatus: PermissionStatus.PENDING,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalVendors = await Vendor.countDocuments({
      permissionStatus: PermissionStatus.PENDING,
    });

    res.render("admin/vendorsPendings", {
      layout: "layouts/adminLayout",
      activePage: "vendors",
      admin: req.admin,
      vendors,
      currentPage: page,
      totalVendors,
      totalPages: Math.ceil(totalVendors / limit),
    });
  } catch (error) {
    console.log("Vendors pending page load Error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.body;

    if (!vendorId) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VENDOR_ID_REQUIRED);

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return errorResponse(res, HttpStatus.NOT_FOUND, Messages.VENDOR_NOT_FOUND);

    vendor.permissionStatus = PermissionStatus.APPROVED.toLowerCase();
    await vendor.save();
    success(res, HttpStatus.OK, Messages.VENDOR_APPROVED_SUCCESS);
  } catch (error) {
    console.error("Error approving vendor:", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const cancelVendor = async (req, res) => {
  try {
    const { vendorId } = req.body;
    if (!vendorId) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VENDOR_ID_REQUIRED);

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return errorResponse(res, HttpStatus.NOT_FOUND, Messages.VENDOR_NOT_FOUND);
    //cancel
    vendor.permissionStatus = PermissionStatus.REJECTED.toLowerCase();
    await vendor.save();

    return success(res, HttpStatus.OK, Messages.VENDOR_REJECTED_SUCCESS);
  } catch (error) {
    console.log("vendor rejection ", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadVendors,
  blockAndUnblock,
  loadVendorsPendings,
  approveVendor,
  cancelVendor,
};
