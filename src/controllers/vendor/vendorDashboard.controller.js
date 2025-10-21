const Order = require("../../models/common/orderSchema");

const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    res.render("vendor/dashboard", {
      layout: "layouts/vendorLayout",
      activePage: "dashboard",
      vendor: req.vendor,
      topProducts: await getVendorTopProducts(vendorId),
      topCategories: await getVendorTopCategories(vendorId),
      topCustomers: await getVendorTopCustomers(vendorId),
      chartData: JSON.stringify(await getVendorChartData(vendorId)),
    });
  } catch (error) {
    console.error("Vendor Dashboard error:", error);
    res.status(500).render("error", { message: "Failed to load dashboard" });
  }
};

const getVendorTopProducts = async (vendorId) => {
  return await Order.aggregate([
    { $unwind: "$products" },
    {
      $match: {
        "products.orderStatus": "completed",
        "products.vendorId": vendorId,
      },
    },
    { $group: { _id: "$products.name", quantity: { $sum: "$products.quantity" } } },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, name: "$_id", quantity: 1 } },
  ]).catch(() => []);
};

const getVendorTopCategories = async (vendorId) => {
  return await Order.aggregate([
    { $unwind: "$products" },
    {
      $match: {
        "products.orderStatus": "completed",
        "products.vendorId": vendorId,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $lookup: {
        from: "categories",
        localField: "productDetails.category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $group: {
        _id: "$categoryDetails._id",
        categoryName: { $first: "$categoryDetails.name" },
        totalRevenue: { $sum: "$products.productTotal" },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        categoryName: 1,
        totalRevenue: { $round: ["$totalRevenue", 0] },
      },
    },
  ]).catch(() => []);
};

const getVendorTopCustomers = async (vendorId) => {
  return await Order.aggregate([
    { $unwind: "$products" },
    {
      $match: {
        "products.orderStatus": "completed",
        "products.vendorId": vendorId,
      },
    },
    {
      $group: {
        _id: "$customerId",
        revenue: { $sum: "$products.productTotal" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        name: {
          $ifNull: ["$customer.name", { $ifNull: ["$customer.fullName", { $ifNull: ["$customer.username", "$customer.email"] }] }],
        },
        totalRevenue: { $round: ["$revenue", 0] },
        orderCount: 1,
      },
    },
  ]).catch(() => []);
};

const getVendorChartData = async (vendorId) => {
  return {
    weekly: await getVendorWeeklyData(vendorId),
    monthly: await getVendorMonthlyData(vendorId),
    yearly: await getVendorYearlyData(vendorId),
  };
};

const getVendorWeeklyData = async (vendorId) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 6);

  const data = await Order.aggregate([
    { $unwind: "$products" },
    {
      $match: {
        "products.orderStatus": "completed",
        "products.vendorId": vendorId,
        createdAt: { $gte: fromDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$products.productTotal" },
      },
    },
  ]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const labels = [],
    values = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(dayNames[date.getDay()]);
    values.push(data.find((d) => d._id === date.toISOString().split("T")[0])?.revenue || 0);
  }

  return { labels, data: values };
};

const getVendorMonthlyData = async (vendorId) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);

  const data = await Order.aggregate([
    { $unwind: "$products" },
    {
      $match: {
        "products.orderStatus": "completed",
        "products.vendorId": vendorId,
        createdAt: { $gte: fromDate },
      },
    },
    {
      $group: {
        _id: { $week: "$createdAt" },
        revenue: { $sum: "$products.productTotal" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const values = [0, 0, 0, 0];

  data.forEach((d, i) => {
    if (i < 4) values[i] = d.revenue;
  });

  return { labels, data: values };
};

const getVendorYearlyData = async (vendorId) => {
  const data = await Order.aggregate([
    { $unwind: "$products" },
    {
      $match: {
        "products.orderStatus": "completed",
        "products.vendorId": vendorId,
      },
    },
    { $group: { _id: { $month: "$createdAt" }, revenue: { $sum: "$products.productTotal" } } },
  ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const values = new Array(12).fill(0);
  data.forEach((item) => (values[item._id - 1] = item.revenue));

  return { labels: months, data: values };
};

module.exports = { getVendorDashboard };
