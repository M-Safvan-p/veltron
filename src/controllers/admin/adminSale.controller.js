const { error: errorResponse } = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");
const Order = require("../../models/common/orderSchema");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const loadSaleReport = async (req, res) => {
  try {
    const filter = req.query.filter || "month";
    const customStartDate = req.query.startDate;
    const customEndDate = req.query.endDate;

    let startDate, endDate;
    if (filter === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const defaultFilter = filter === "custom" ? "month" : filter;
      var { startDate: sDate, endDate: eDate } = getDateRange(defaultFilter);
      startDate = sDate;
      endDate = eDate;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    const skip = (page - 1) * limit;

    // orders
    const orders = await Order.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
    })
      .populate("customerId", "fullName email")
      .populate("products.vendorId", "brandName")
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrdersCount = await Order.countDocuments({
      invoiceDate: { $gte: startDate, $lte: endDate },
    });
    const totalPages = Math.ceil(totalOrdersCount / limit);
    const allOrders = await Order.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
    }).populate("products.vendorId", "brandName");

    // Calculate totals from ALL orders
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalProductsSold = 0;
    let processingOrders = 0;
    let shippedOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    const vendorSet = new Set();

    allOrders.forEach((order) => {
      order.products.forEach((product) => {
        vendorSet.add(product.vendorId._id.toString());
        // Add to totals
        totalRevenue += product.productTotal;
        totalCommission += product.productTotal - product.vendorEarning;
        totalProductsSold += product.quantity;
        if (product.orderStatus === "processing") processingOrders++;
        if (product.orderStatus === "shipped") shippedOrders++;
        if (product.orderStatus === "completed") completedOrders++;
        if (product.orderStatus === "cancelled") cancelledOrders++;
      });
    });

    const reportData = {
      orders: orders,
      filter: filter,
      totalOrders: totalOrdersCount,
      totalRevenue: totalRevenue.toFixed(2),
      totalCommission: totalCommission.toFixed(2),
      totalProductsSold: totalProductsSold,
      activeVendors: vendorSet.size,
      processingOrders: processingOrders,
      shippedOrders: shippedOrders,
      completedOrders: completedOrders,
      cancelledOrders: cancelledOrders,
      // date
      startDate: new Date(startDate).toLocaleDateString("en-GB"),
      endDate: new Date(endDate).toLocaleDateString("en-GB"),
    };

    res.render("admin/sale", {
      layout: "layouts/adminLayout",
      admin: req.admin,
      reportData,
      orders,
      activePage: "sales",
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error in sales report:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const exportPDF = async (req, res) => {
  try {
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

    // Fetch all orders for admin view
    const orders = await Order.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
    })
      .populate("customerId", "fullName email")
      .populate("products.vendorId", "brandName")
      .sort({ invoiceDate: -1 });

    // Create PDF with landscape orientation for better column space
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=admin_sales_report_${new Date().toISOString().split("T")[0]}.pdf`);
    doc.pipe(res);

    // Page dimensions (A4 landscape)
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 40;

    // Enhanced column layout with vendor column
    const tableTop = 160;
    const columns = {
      orderId: { x: margin, width: 70 },
      date: { x: margin + 75, width: 65 },
      customer: { x: margin + 145, width: 95 },
      vendor: { x: margin + 245, width: 95 },
      items: { x: margin + 345, width: 40 },
      payment: { x: margin + 390, width: 70 },
      total: { x: margin + 465, width: 75 },
      commission: { x: margin + 545, width: 75 },
      coupon: { x: margin + 635, width: 60 },
      status: { x: margin + 700, width: 65 },
    };

    // Helper function to draw table header
    const drawTableHeader = (yPos) => {
      // Header background
      doc.rect(margin, yPos - 8, pageWidth - margin * 2, 28).fill("#1a2332");

      // Header text
      doc.fontSize(8).fillColor("#ffffff").font("Helvetica-Bold");

      doc
        .text("Order ID", columns.orderId.x, yPos, { width: columns.orderId.width })
        .text("Date", columns.date.x, yPos, { width: columns.date.width })
        .text("Customer", columns.customer.x, yPos, { width: columns.customer.width })
        .text("Vendor", columns.vendor.x, yPos, { width: columns.vendor.width })
        .text("Items", columns.items.x, yPos, { width: columns.items.width, align: "center" })
        .text("Payment", columns.payment.x, yPos, { width: columns.payment.width })
        .text("Total", columns.total.x, yPos, { width: columns.total.width, align: "right" })
        .text("Commission", columns.commission.x, yPos, { width: columns.commission.width, align: "right" })
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
      .text("ADMIN SALES REPORT", margin, 35, {
        align: "center",
        width: pageWidth - margin * 2,
      });

    // Subtitle
    doc
      .fontSize(14)
      .fillColor("#ecf0f1")
      .font("Helvetica")
      .text("Platform-Wide Sales Overview", margin, 70, {
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
    let totalCommission = 0;
    let rowCount = 0;
    let totalItems = 0;
    let vendorSet = new Set();

    // Process orders - Group by vendor within each order
    orders.forEach((order) => {
      // Group products by vendor
      const vendorGroups = {};

      order.products.forEach((p) => {
        const vendorId = p.vendorId._id.toString();
        vendorSet.add(vendorId);

        if (!vendorGroups[vendorId]) {
          vendorGroups[vendorId] = {
            vendorName: p.vendorId.storeName || p.vendorId.fullName || "Unknown",
            products: [],
            total: 0,
            commission: 0,
            itemCount: 0,
          };
        }

        vendorGroups[vendorId].products.push(p);
        vendorGroups[vendorId].total += p.productTotal;
        vendorGroups[vendorId].commission += p.productTotal - p.vendorEarning;
        vendorGroups[vendorId].itemCount += p.quantity;
      });

      // Create a row for each vendor in the order
      Object.values(vendorGroups).forEach((vendorGroup) => {
        grandTotal += vendorGroup.total;
        totalCommission += vendorGroup.commission;
        totalItems += vendorGroup.itemCount;

        // Page break check
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 50;
          drawTableHeader(yPosition);
          yPosition += 35;
        }

        // Alternate row background
        if (rowCount % 2 === 0) {
          doc.rect(margin, yPosition - 6, pageWidth - margin * 2, 24).fill("#f8f9fa");
        }

        // Row data
        doc.fontSize(8).fillColor("#2c3e50").font("Helvetica");

        const orderId = order.orderId?.toString().slice(-8) || order._id.toString().slice(-8);
        const orderDate = new Date(order.invoiceDate).toLocaleDateString("en-GB");
        const customerName = order.customerId?.fullName || "Unknown";
        const vendorName = vendorGroup.vendorName;
        const paymentMethod = order.paymentMethod || "N/A";
        const couponCode = order.couponDetails?.code || "-";

        // Get status priority
        const priority = ["processing", "shipped", "completed", "cancelled"];
        let status = "processing";
        for (let s of priority) {
          if (vendorGroup.products.some((p) => p.orderStatus === s)) {
            status = s;
            break;
          }
        }

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
          .text(vendorName, columns.vendor.x, yPosition, {
            width: columns.vendor.width,
            ellipsis: true,
          })
          .text(vendorGroup.itemCount.toString(), columns.items.x, yPosition, {
            width: columns.items.width,
            align: "center",
          })
          .text(paymentMethod, columns.payment.x, yPosition, {
            width: columns.payment.width,
            ellipsis: true,
          });

        // Total with bold font
        doc.font("Helvetica-Bold").text(`₹${vendorGroup.total.toFixed(2)}`, columns.total.x, yPosition, {
          width: columns.total.width,
          align: "right",
        });

        // Commission with color
        doc.fillColor("#856404").text(`₹${vendorGroup.commission.toFixed(2)}`, columns.commission.x, yPosition, {
          width: columns.commission.width,
          align: "right",
        });

        doc.fillColor("#2c3e50").font("Helvetica").text(couponCode, columns.coupon.x, yPosition, {
          width: columns.coupon.width,
          ellipsis: true,
        });

        // Status with color coding
        const statusColor =
          status === "completed"
            ? "#27ae60"
            : status === "cancelled"
              ? "#e74c3c"
              : status === "shipped"
                ? "#3498db"
                : status === "processing"
                  ? "#f39c12"
                  : "#95a5a6";

        doc.fillColor(statusColor).fontSize(7).text(status.toUpperCase(), columns.status.x, yPosition, {
          width: columns.status.width,
        });

        yPosition += 24;
        rowCount++;
      });
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
    const summaryBoxHeight = 80;
    doc.rect(margin, yPosition, pageWidth - margin * 2, summaryBoxHeight).fill("#ecf0f1");

    yPosition += 15;

    // Summary details
    doc.fontSize(10).fillColor("#2c3e50").font("Helvetica");

    const summaryX = margin + 20;
    const summarySpacing = 160;

    // First row
    doc
      .text(`Total Orders: ${orders.length}`, summaryX, yPosition)
      .text(`Active Vendors: ${vendorSet.size}`, summaryX + summarySpacing, yPosition)
      .text(`Total Items: ${totalItems}`, summaryX + summarySpacing * 2, yPosition)
      .text(`Avg Order: ₹${orders.length > 0 ? (grandTotal / orders.length).toFixed(2) : "0.00"}`, summaryX + summarySpacing * 3, yPosition);

    // Second row - Totals
    yPosition += 30;
    doc.fontSize(13).font("Helvetica-Bold");

    doc.fillColor("#27ae60").text("TOTAL REVENUE:", summaryX, yPosition);

    doc.fontSize(15).text(`₹${grandTotal.toFixed(2)}`, summaryX + 150, yPosition);

    doc
      .fontSize(13)
      .fillColor("#856404")
      .text("COMMISSION:", summaryX + 340, yPosition);

    doc.fontSize(15).text(`₹${totalCommission.toFixed(2)}`, summaryX + 480, yPosition);

    // Vendor payout calculation
    const vendorPayout = grandTotal - totalCommission;
    doc
      .fontSize(11)
      .fillColor("#2c3e50")
      .font("Helvetica")
      .text(`Vendor Payout: ₹${vendorPayout.toFixed(2)}`, summaryX + summarySpacing * 3 + 20, yPosition + 5);

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
      .text(`Page 1 of 1 | Confidential - Admin Use Only`, margin, footerY + 8, { align: "right", width: pageWidth - margin * 2 });

    doc.end();
  } catch (error) {
    console.error("Error exporting admin sales PDF:", error);
    res.status(500).send("Error generating PDF");
  }
};

const exportExcel = async (req, res) => {
  try {
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

    // Fetch all orders for admin view
    const orders = await Order.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
    })
      .populate("customerId", "fullName email")
      .populate("products.vendorId", "brandName")
      .sort({ invoiceDate: -1 });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Admin Sales Report");

    // Set worksheet properties
    worksheet.properties.defaultRowHeight = 20;

    // Define columns with admin-specific fields
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 18 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer Name", key: "customer", width: 25 },
      { header: "Customer Email", key: "customerEmail", width: 30 },
      { header: "Vendor Name", key: "vendor", width: 25 },
      { header: "Items", key: "items", width: 10 },
      { header: "Payment Method", key: "payment", width: 15 },
      { header: "Order Total (₹)", key: "total", width: 15 },
      { header: "Commission (₹)", key: "commission", width: 15 },
      { header: "Vendor Earning (₹)", key: "vendorEarning", width: 18 },
      { header: "Coupon Code", key: "coupon", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2C3E50" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Process orders - Group by vendor within each order
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalVendorEarnings = 0;
    let totalItems = 0;
    let totalDiscount = 0;
    const vendorSet = new Set();

    orders.forEach((order) => {
      // Group products by vendor
      const vendorGroups = {};

      order.products.forEach((p) => {
        const vendorId = p.vendorId._id.toString();
        vendorSet.add(vendorId);

        if (!vendorGroups[vendorId]) {
          vendorGroups[vendorId] = {
            vendorName: p.vendorId.brandName,
            // vendorEmail: p.vendorId.email || "N/A",
            products: [],
            total: 0,
            commission: 0,
            vendorEarning: 0,
            itemCount: 0,
          };
        }

        vendorGroups[vendorId].products.push(p);
        vendorGroups[vendorId].total += p.productTotal;
        vendorGroups[vendorId].commission += p.productTotal - p.vendorEarning;
        vendorGroups[vendorId].vendorEarning += p.vendorEarning;
        vendorGroups[vendorId].itemCount += p.quantity;
      });

      // Create a row for each vendor in the order
      Object.values(vendorGroups).forEach((vendorGroup) => {
        totalRevenue += vendorGroup.total;
        totalCommission += vendorGroup.commission;
        totalVendorEarnings += vendorGroup.vendorEarning;
        totalItems += vendorGroup.itemCount;

        // Get status priority
        const priority = ["processing", "shipped", "completed", "cancelled"];
        let status = "processing";
        for (let s of priority) {
          if (vendorGroup.products.some((p) => p.orderStatus === s)) {
            status = s;
            break;
          }
        }

        // Calculate discount for this vendor's portion
        const vendorDiscount = order.couponDetails.discount ? (order.couponDetails.discount * (vendorGroup.total / order.finalAmount)).toFixed(2) : 0;

        if (order.couponDetails.discount) {
          totalDiscount += parseFloat(vendorDiscount);
        }

        const row = worksheet.addRow({
          orderId: order.orderId?.toString().slice(-10) || order._id.toString().slice(-10),
          date: new Date(order.invoiceDate).toLocaleDateString("en-GB"),
          customer: order.customerId?.fullName || "N/A",
          customerEmail: order.customerId?.email || "N/A",
          vendor: vendorGroup.vendorName,
          // vendorEmail: vendorGroup.vendorEmail,
          items: vendorGroup.itemCount,
          payment: order.paymentMethod || "COD",
          total: vendorGroup.total.toFixed(2),
          commission: vendorGroup.commission.toFixed(2),
          vendorEarning: vendorGroup.vendorEarning.toFixed(2),
          coupon: order.couponDetails.code || "N/A",
          // discount: vendorDiscount,
          status: status.charAt(0).toUpperCase() + status.slice(1),
        });

        // Apply row styling
        row.alignment = { vertical: "middle", horizontal: "left" };

        // Color code status
        const statusCell = row.getCell("status");
        if (status === "completed") {
          statusCell.font = { color: { argb: "FF27AE60" }, bold: true };
        } else if (status === "cancelled") {
          statusCell.font = { color: { argb: "FFE74C3C" }, bold: true };
        } else if (status === "shipped") {
          statusCell.font = { color: { argb: "FF3498DB" }, bold: true };
        } else if (status === "processing") {
          statusCell.font = { color: { argb: "FFF39C12" }, bold: true };
        }

        // Highlight commission column
        row.getCell("commission").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF3CD" },
        };
        row.getCell("commission").font = { bold: true, color: { argb: "FF856404" } };
      });
    });

    // Add spacing rows
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Add summary section
    // Summary header
    const summaryHeaderRow = worksheet.addRow(["SALES SUMMARY"]);
    summaryHeaderRow.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    summaryHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3498DB" },
    };
    summaryHeaderRow.height = 30;
    summaryHeaderRow.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.mergeCells(`A${summaryHeaderRow.number}:N${summaryHeaderRow.number}`);

    // Summary data
    const summaryData = [
      { label: "Report Period", value: `${new Date(startDate).toLocaleDateString("en-GB")} - ${new Date(endDate).toLocaleDateString("en-GB")}` },
      { label: "Total Orders", value: orders.length },
      { label: "Active Vendors", value: vendorSet.size },
      { label: "Total Items Sold", value: totalItems },
      { label: "", value: "" }, // Spacer
      { label: "Total Revenue", value: `₹${totalRevenue.toFixed(2)}` },
      { label: "Total Commission", value: `₹${totalCommission.toFixed(2)}` },
      { label: "Total Vendor Earnings", value: `₹${totalVendorEarnings.toFixed(2)}` },
      { label: "Total Discounts", value: `₹${totalDiscount.toFixed(2)}` },
      { label: "", value: "" }, // Spacer
      { label: "Average Order Value", value: `₹${orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : "0.00"}` },
      { label: "Average Commission per Order", value: `₹${orders.length > 0 ? (totalCommission / orders.length).toFixed(2) : "0.00"}` },
    ];

    summaryData.forEach((item) => {
      const row = worksheet.addRow([item.label, item.value]);
      row.font = { bold: true, size: 11 };
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFECF0F1" },
      };

      // Highlight financial totals
      if (item.label.includes("Total") || item.label.includes("Average")) {
        row.getCell(2).font = { bold: true, size: 12, color: { argb: "FF27AE60" } };
      }

      if (item.label === "Total Commission") {
        row.getCell(2).font = { bold: true, size: 12, color: { argb: "FF856404" } };
      }
    });

    // Add footer
    worksheet.addRow([]);
    const footerRow = worksheet.addRow([`Generated on ${new Date().toLocaleString("en-GB")} | Confidential - Admin Use Only`]);
    footerRow.font = { italic: true, size: 9, color: { argb: "FF95A5A6" } };
    worksheet.mergeCells(`A${footerRow.number}:N${footerRow.number}`);
    footerRow.alignment = { horizontal: "center" };

    // Apply autofilter to main data
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 14 },
    };

    // Freeze header row
    worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        if (rowNumber <= worksheet.lastRow.number - 15) {
          // Don't border summary section
          cell.border = {
            top: { style: "thin", color: { argb: "FFE9ECEF" } },
            left: { style: "thin", color: { argb: "FFE9ECEF" } },
            bottom: { style: "thin", color: { argb: "FFE9ECEF" } },
            right: { style: "thin", color: { argb: "FFE9ECEF" } },
          };
        }
      });
    });

    // Write to response
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=admin_sales_report_${new Date().toISOString().split("T")[0]}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting admin sales Excel:", error);
    res.status(500).send("Error generating Excel");
  }
};

module.exports = {
  loadSaleReport,
  exportPDF,
  exportExcel,
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
