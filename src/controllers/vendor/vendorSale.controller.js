const { error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");
const Order = require("../../models/common/orderSchema");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const loadSaleReport = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const filter = req.query.filter || "month";
    const customStartDate = req.query.startDate;
    const customEndDate = req.query.endDate;

    let startDate, endDate;
    if (filter === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const defaultFilter = filter === "custom" ? "month" : filter;
      const { startDate: sDate, endDate: eDate } = getDateRange(defaultFilter);
      startDate = sDate;
      endDate = eDate;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get orders
    const orders = await Order.find({
      "products.vendorId": vendorId,
      orderStatus:"completed",
      invoiceDate: { $gte: startDate, $lte: endDate },
    }).populate("customerId", "fullName email")
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({
      orderStatus:"completed",
      "products.vendorId": vendorId,
      invoiceDate: { $gte: startDate, $lte: endDate },
    });
    const totalPages = Math.ceil(totalOrders / limit);

    const totalOrdersCount = await Order.find({ "products.vendorId": vendorId });
    // Calculate totals
    let totalRevenue = 0;
    let totalEarnings = 0;
    let totalProductsSold = 0;
    let processingOrders = 0;
    let shippedOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let fullOrder = totalOrdersCount.length 

    // Loop through orders
    totalOrdersCount.forEach((order) => {
      const vendorProducts = order.products.filter((product) => product.vendorId.toString() === vendorId.toString());
      // Calculate totals for vendor products
      vendorProducts.forEach((product) => {
        totalRevenue += product.productTotal;
        totalEarnings += product.vendorEarning;
        totalProductsSold += product.quantity;
      });
      if (order.orderStatus === "processing") processingOrders++;
      if (order.orderStatus === "shipped") shippedOrders++;
      if (order.orderStatus === "cancelled") cancelledOrders++;
      if (order.orderStatus === "completed") completedOrders++;
    });

    const reportData = {
      orders: orders,
      filter: filter,
      // Summary
      totalOrders: totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalEarnings: totalEarnings.toFixed(2),
      totalProductsSold: totalProductsSold,
      // Status counts
      processingOrders: processingOrders,
      shippedOrders: shippedOrders,
      completedOrders: completedOrders,
      cancelledOrders: cancelledOrders,
      fullOrder:fullOrder,
      // Date info
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
    };

    res.render("vendor/sale", {
      layout: "layouts/vendorLayout",
      vendor: req.vendor,
      reportData,
      orders,
      activePage: "sales",
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalOrdersCount,
      limit,
    });
  } catch (error) {
    console.error("Error in sales report:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const exportPDF = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const filter = req.query.filter || "month";
    const customStartDate = req.query.startDate;
    const customEndDate = req.query.endDate;

    let startDate, endDate;
    if (filter === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate).setHours(23, 59, 59, 999);
    } else {
      const defaultFilter = filter === "custom" ? "month" : filter;
      const { startDate: sDate, endDate: eDate } = getDateRange(defaultFilter);
      startDate = sDate;
      endDate = eDate;
    }

    // Fetch orders
    const orders = await Order.find({
      "products.vendorId": vendorId,
      invoiceDate: { $gte: startDate, $lte: endDate },
    })
      .populate("customerId", "fullName email")
      .sort({ invoiceDate: -1 });

    // Create PDF with landscape orientation for better column space
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape", // Better for wide tables
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=sales_report_${new Date().toISOString().split("T")[0]}.pdf`);
    doc.pipe(res);

    // Page dimensions (A4 landscape)
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 40;

    // Enhanced column layout with better spacing
    const tableTop = 160;
    const columns = {
      orderId: { x: margin, width: 80 },
      date: { x: margin + 85, width: 75 },
      customer: { x: margin + 165, width: 120 },
      items: { x: margin + 290, width: 50 },
      payment: { x: margin + 345, width: 85 },
      total: { x: margin + 435, width: 70 },
      coupon: { x: margin + 545, width: 80 },
      status: { x: margin + 630, width: 70 },
    };

    // Helper function to draw table header
    const drawTableHeader = (yPos) => {
      // Header background
      doc.rect(margin, yPos - 8, pageWidth - margin * 2, 28).fill("#1a2332");

      // Header text
      doc.fontSize(9).fillColor("#ffffff").font("Helvetica-Bold");

      doc
        .text("Order ID", columns.orderId.x, yPos, { width: columns.orderId.width })
        .text("Date", columns.date.x, yPos, { width: columns.date.width })
        .text("Customer", columns.customer.x, yPos, { width: columns.customer.width })
        .text("Items", columns.items.x, yPos, { width: columns.items.width, align: "center" })
        .text("Payment", columns.payment.x, yPos, { width: columns.payment.width })
        .text("Total", columns.total.x, yPos, { width: columns.total.width, align: "right" })
        .text("Coupon", columns.coupon.x, yPos, { width: columns.coupon.width })
        .text("Status", columns.status.x, yPos, { width: columns.status.width });

      // Bottom border
      doc
        .moveTo(margin, yPos + 22)
        .lineTo(pageWidth - margin, yPos + 22)
        .strokeColor("#3498db")
        .lineWidth(2)
        .stroke();
    };

    // ===== HEADER SECTION =====
    // Header background with gradient effect
    doc.rect(0, 0, pageWidth, 130).fill("#2c3e50");

    // Accent bar
    doc.rect(0, 130, pageWidth, 5).fill("#3498db");

    // Title
    doc
      .fontSize(28)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text("SALES REPORT", margin, 35, {
        align: "center",
        width: pageWidth - margin * 2,
      });

    // Subtitle
    doc
      .fontSize(14)
      .fillColor("#ecf0f1")
      .font("Helvetica")
      .text("Veltron", margin, 70, {
        align: "center",
        width: pageWidth - margin * 2,
      });

    // Date range
    doc
      .fontSize(11)
      .fillColor("#bdc3c7")
      .text(`Period: ${new Date(startDate).toLocaleDateString("en-GB")} - ${new Date(endDate).toLocaleDateString("en-GB")}`, margin, 95, {
        align: "center",
        width: pageWidth - margin * 2,
      });

    // ===== TABLE SECTION =====
    drawTableHeader(tableTop);

    let yPosition = tableTop + 35;
    let grandTotal = 0;
    let rowCount = 0;
    let totalItems = 0;

    // Process orders
    orders.forEach((order, index) => {
      let orderTotal = 0;
      let itemsCount = 0;

      order.products.forEach((p) => {
        if (p.vendorId.toString() === vendorId.toString()) {
          orderTotal += p.vendorEarning;
          itemsCount += p.quantity;
        }
      });

      grandTotal += orderTotal;
      totalItems += itemsCount;

      // Page break check
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 50;
        drawTableHeader(yPosition);
        yPosition += 35;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(margin, yPosition - 6, pageWidth - margin * 2, 24).fill("#f8f9fa");
      }

      // Row data
      doc.fontSize(9).fillColor("#2c3e50").font("Helvetica");

      const orderId = order.orderId?.toString().slice(-8) || order._id.toString().slice(-8);
      const orderDate = new Date(order.invoiceDate).toLocaleDateString("en-GB");
      const customerName = order.customerId?.fullName || "Unknown";
      const paymentMethod = order.paymentMethod || "N/A";
      const couponCode = order.couponDetails?.code || "-";
      const status = order.orderStatus || "N/A";

      doc
        .text(orderId, columns.orderId.x, yPosition, {
          width: columns.orderId.width,
          ellipsis: true,
        })
        .text(orderDate, columns.date.x, yPosition, {
          width: columns.date.width,
        })
        .text(customerName, columns.customer.x, yPosition, {
          width: columns.customer.width,
          ellipsis: true,
        })
        .text(itemsCount.toString(), columns.items.x, yPosition, {
          width: columns.items.width,
          align: "center",
        })
        .text(paymentMethod, columns.payment.x, yPosition, {
          width: columns.payment.width,
          ellipsis: true,
        });

      // Total with bold font
      doc.font("Helvetica-Bold").text(`₹${orderTotal.toFixed(2)}`, columns.total.x, yPosition, {
        width: columns.total.width,
        align: "right",
      });

      doc.font("Helvetica").text(couponCode, columns.coupon.x, yPosition, {
        width: columns.coupon.width,
        ellipsis: true,
      });

      // Status with color coding
      const statusColor = status === "Delivered" ? "#27ae60" : status === "Cancelled" ? "#e74c3c" : status === "Pending" ? "#f39c12" : "#95a5a6";

      doc.fillColor(statusColor).text(status, columns.status.x, yPosition, {
        width: columns.status.width,
      });

      yPosition += 24;
      rowCount++;
    });

    // ===== SUMMARY SECTION =====
    yPosition += 20;

    // Separator line
    doc
      .moveTo(margin, yPosition)
      .lineTo(pageWidth - margin, yPosition)
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .stroke();

    yPosition += 15;

    // Summary box
    const summaryBoxHeight = 60;
    doc.rect(margin, yPosition, pageWidth - margin * 2, summaryBoxHeight).fill("#ecf0f1");

    yPosition += 15;

    // Summary details
    doc.fontSize(11).fillColor("#2c3e50").font("Helvetica");

    const summaryX = margin + 20;
    const summarySpacing = 180;

    doc
      .text(`Total Orders: ${rowCount}`, summaryX, yPosition)
      .text(`Total Items: ${totalItems}`, summaryX + summarySpacing, yPosition)
      .text(`Average Order: ₹${rowCount > 0 ? (grandTotal / rowCount).toFixed(2) : "0.00"}`, summaryX + summarySpacing * 2, yPosition);

    // Grand total
    yPosition += 25;
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#27ae60")
      .text("GRAND TOTAL:", summaryX, yPosition)
      .fontSize(16)
      .text(`₹${grandTotal.toFixed(2)}`, summaryX + 150, yPosition);

    // ===== FOOTER =====
    const footerY = pageHeight - 35;

    doc
      .moveTo(margin, footerY)
      .lineTo(pageWidth - margin, footerY)
      .strokeColor("#bdc3c7")
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(8)
      .fillColor("#95a5a6")
      .font("Helvetica")
      .text(`Generated on ${new Date().toLocaleString("en-GB")}`, margin, footerY + 8)
      .text(`Page 1 of 1`, margin, footerY + 8, { align: "right", width: pageWidth - margin * 2 });

    doc.end();
  } catch (error) {
    console.error("Error exporting sales PDF:", error);
    res.status(500).send("Error generating PDF");
  }
};

const exportExcel = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const filter = req.query.filter || "month";
    const customStartDate = req.query.startDate;
    const customEndDate = req.query.endDate;

    let startDate, endDate;
    if (filter === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate).setHours(23, 59, 59, 999);
    } else {
      const defaultFilter = filter === "custom" ? "month" : filter;
      var { startDate: sDate, endDate: eDate } = getDateRange(defaultFilter);
      startDate = sDate;
      endDate = eDate;
    }

    // Fetch orders
    const orders = await Order.find({
      "products.vendorId": vendorId,
      invoiceDate: { $gte: startDate, $lte: endDate },
    })
      .populate("customerId", "fullName email")
      .sort({ invoiceDate: -1 });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Define columns
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Items", key: "items", width: 10 },
      { header: "Payment", key: "payment", width: 15 },
      { header: "Total (₹)", key: "total", width: 15 },
      { header: "Coupon", key: "coupon", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Add rows
    orders.forEach((order) => {
      let total = 0;
      let itemsCount = 0;
      order.products.forEach((p) => {
        if (p.vendorId.toString() === vendorId.toString()) {
          total += p.vendorEarning;
          itemsCount += p.quantity;
        }
      });

      worksheet.addRow({
        orderId: order.orderId?.toString().slice(-10) || order._id.toString().slice(-10),
        date: new Date(order.invoiceDate).toLocaleDateString("en-GB"),
        customer: order.customerId?.fullName || "N/A",
        items: itemsCount,
        payment: order.paymentMethod || "N/A",
        total: total.toFixed(2),
        coupon: order.couponDetails.code || "N/A",
        status: order.orderStatus || "N/A",
      });
    });

    // Format header row bold
    worksheet.getRow(1).font = { bold: true };

    // Optional: autofilter for easy sorting in Excel
    worksheet.autoFilter = {
      from: "A1",
      to: "H1",
    };

    // Write to response
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=sales_report.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting sales Excel:", error);
    res.status(500).send("Error generating Excel");
  }
};

const getDateRange = (filter) => {
  const today = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (filter === "today") {
    // today
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (filter === "week") {
    // 7 days
    startDate.setDate(today.getDate() - 7);
  } else if (filter === "month") {
    // 30 days
    startDate.setDate(today.getDate() - 30);
  } else if (filter === "year") {
    // 365 days
    startDate.setDate(today.getDate() - 365);
  }

  return { startDate, endDate };
};

module.exports = {
  loadSaleReport,
  exportPDF,
  exportExcel,
};
