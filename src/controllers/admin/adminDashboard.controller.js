const Order = require("../../models/common/orderSchema");

const getDashboard = async (req, res) => {
  try {
    res.render("admin/dashboard", {
      layout: "layouts/adminLayout",
      activePage: "dashboard",
      admin: req.admin,
      topProducts: await getTopProducts(),
      topCategories: await getTopCategories(),
      topBrands: await getTopBrands(),
      chartData: JSON.stringify(await getChartData()),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).render("error", { message: "Failed to load dashboard" });
  }
};

const getTopProducts = async () => {
  return await Order.aggregate([
    { $unwind: "$products" },
    { $match: { "products.orderStatus": "completed" } },
    { $group: { _id: "$products.name", quantity: { $sum: "$products.quantity" } } },
    { $sort: { quantity: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, name: "$_id", quantity: 1 } },
  ]).catch(() => []);
};

const getTopCategories = async () => {
  return await Order.aggregate([
    { $unwind: "$products" },
    { $match: { "products.orderStatus": "completed" } },
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
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        categoryName: 1,
        totalRevenue: { $round: ["$totalRevenue", 0] },
      },
    },
  ]).catch(() => []);
};

const getTopBrands = async () => {
  return await Order.aggregate([
    { $unwind: "$products" },
    { $match: { "products.orderStatus": "completed" } },
    {
      $lookup: {
        from: "vendors",
        localField: "products.vendorId",
        foreignField: "_id",
        as: "vendor",
      },
    },
    { $unwind: "$vendor" },
    { $group: { _id: "$vendor.brandName", revenue: { $sum: "$products.productTotal" } } },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, name: { $ifNull: ["$_id", "Unknown"] }, totalRevenue: { $round: ["$revenue", 0] } } },
  ]).catch(() => []);
};

const getChartData = async () => {
  return {
    weekly: await getWeeklyData(),
    monthly: await getMonthlyData(),
    yearly: await getYearlyData(),
  };
};

const getWeeklyData = async () => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 6);

  const data = await Order.aggregate([
    { $unwind: "$products" },
    { $match: { "products.orderStatus": "completed", createdAt: { $gte: fromDate } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$products.productTotal" } } },
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

const getMonthlyData = async () => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);

  const data = await Order.aggregate([
    { $unwind: "$products" },
    {
      $match: {
        "products.orderStatus": "completed",
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

const getYearlyData = async () => {
  const data = await Order.aggregate([
    { $unwind: "$products" },
    { $match: { "products.orderStatus": "completed" } },
    { $group: { _id: { $month: "$createdAt" }, revenue: { $sum: "$products.productTotal" } } },
  ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const values = new Array(12).fill(0);
  data.forEach((item) => (values[item._id - 1] = item.revenue));

  return { labels: months, data: values };
};

module.exports = {
  getDashboard,
};
