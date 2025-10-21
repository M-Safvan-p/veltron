const Order = require("../../models/common/orderSchema");
const PDFDocument = require("pdfkit");

// Configuration constants for design theme
const CONFIG = {
  MARGINS: { top: 40, bottom: 40, left: 40, right: 40 },
  COLORS: {
    PRIMARY: "#212529", // Dark gray for main text
    SECONDARY: "#6c757d", // Light gray for secondary text
    NEUTRAL: "#f8f9fa", // Very light gray for backgrounds
    BORDER: "#e9ecef", // Neutral border color
    ACCENT: "#495057", // Secondary dark gray for emphasis
  },
  FONTS: {
    REGULAR: "Helvetica",
    BOLD: "Helvetica-Bold",
    ITALIC: "Helvetica-Oblique",
  },
  SIZES: {
    TITLE: 24,
    SUBTITLE: 14,
    REGULAR: 10,
    SMALL: 8,
    HEADER: 20,
  },
  PAGE_SIZE: "A4",
  CARD: {
    BORDER_RADIUS: 8,
    SHADOW_OFFSET: 2,
    SHADOW_OPACITY: 0.1,
  },
};

// Validation utility
const validateOrderData = (order) => {
  if (!order?.customerId?.fullName || !order?.products?.length || !order?.shippingAddress) {
    throw new Error("Invalid order data: Missing required fields");
  }
  return true;
};

// Generate professional invoice
const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Input validation
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Fetch order with populated references
    const order = await Order.findOne({ orderId: id })
      .populate("customerId", "fullName email phoneNumber")
      .populate("products.productId", "name")
      .populate("products.vendorId", "businessName")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate order data
    validateOrderData(order);

    // Initialize PDF document
    const doc = new PDFDocument({
      margin: CONFIG.MARGINS,
      size: CONFIG.PAGE_SIZE,
      info: {
        Title: `Invoice ${order.orderId}`,
        Author: "Veltron Inc.",
        Subject: "Customer Invoice",
        Creator: "Veltron Billing System",
      },
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderId}.pdf`);
    doc.pipe(res);

    // Helper function to draw a card
    const drawCard = (x, y, width, height) => {
      doc
        .roundedRect(x, y, width, height, CONFIG.CARD.BORDER_RADIUS)
        .fillOpacity(0.05)
        .fill(CONFIG.COLORS.NEUTRAL)
        .fillOpacity(1)
        .lineWidth(1)
        .stroke(CONFIG.COLORS.BORDER);
    };

    // Add header
    const addHeader = () => {
      const headerY = 30;
      drawCard(CONFIG.MARGINS.left, headerY, 510, 80);

      // Company logo placeholder
      doc
        .fontSize(CONFIG.SIZES.HEADER)
        .font(CONFIG.FONTS.BOLD)
        .fillColor(CONFIG.COLORS.PRIMARY)
        .text("VELTRON INC.", CONFIG.MARGINS.left + 15, headerY + 15);

      doc
        .fontSize(CONFIG.SIZES.SMALL)
        .font(CONFIG.FONTS.REGULAR)
        .fillColor(CONFIG.COLORS.SECONDARY)
        .text("Premium Electronics & Gadgets", CONFIG.MARGINS.left + 15, headerY + 35)
        .text("support@veltron.com | +91 98765 43210", CONFIG.MARGINS.left + 15, headerY + 45);

      // Invoice title
      doc
        .fontSize(CONFIG.SIZES.TITLE)
        .font(CONFIG.FONTS.BOLD)
        .fillColor(CONFIG.COLORS.ACCENT)
        .text("INVOICE", 400, headerY + 20, { align: "right" });
    };

    // Add invoice details
    const addInvoiceDetails = (startY) => {
      const leftCol = CONFIG.MARGINS.left + 15;
      const rightCol = 350;
      drawCard(CONFIG.MARGINS.left, startY, 510, 90);

      doc.fillColor(CONFIG.COLORS.PRIMARY).fontSize(CONFIG.SIZES.REGULAR).font(CONFIG.FONTS.BOLD);

      // Left column labels
      doc.text("INVOICE NUMBER:", leftCol, startY + 15);
      doc.text("INVOICE DATE:", leftCol, startY + 30);
      doc.text("ORDER ID:", leftCol, startY + 45);
      doc.text("PAYMENT METHOD:", leftCol, startY + 60);

      // Right column labels
      doc.text("PAYMENT STATUS:", rightCol, startY + 15);
      doc.text("ORDER STATUS:", rightCol, startY + 30);

      doc.font(CONFIG.FONTS.REGULAR);

      // Left column values
      doc
        .fillColor(CONFIG.COLORS.SECONDARY)
        .text(order.orderId.toUpperCase(), leftCol + 100, startY + 15)
        .text(new Date(order.invoiceDate).toLocaleDateString("en-IN"), leftCol + 100, startY + 30)
        .text(order.orderId, leftCol + 100, startY + 45)
        .text(order.paymentMethod || "N/A", leftCol + 100, startY + 60);

      // Right column values
      const statusColor = order.paymentStatus === "completed" ? CONFIG.COLORS.ACCENT : "#dc2626";
      doc
        .fillColor(statusColor)
        .text(order.paymentStatus.toUpperCase(), rightCol + 100, startY + 15)
        .fillColor(CONFIG.COLORS.ACCENT)
        .text(order.orderStatus.toUpperCase(), rightCol + 100, startY + 30);

      return startY + 110;
    };

    // Add billing and shipping details
    const addBillingDetails = (startY) => {
      const leftCol = CONFIG.MARGINS.left + 15;
      const rightCol = 300;

      // Set font for height calculations
      doc.fontSize(CONFIG.SIZES.REGULAR).font(CONFIG.FONTS.REGULAR);

      // Define bill lines
      const billLines = [order.customerId.fullName || "N/A", order.customerId.email || "N/A", order.customerId.phoneNumber || "N/A"].filter(
        (line) => line !== "N/A"
      );

      // Define ship lines - FIXED TEMPLATE LITERALS
      const shipLines = [
        order.shippingAddress.fullName || "N/A",
        order.shippingAddress.fullAddress || "N/A",
        `${order.shippingAddress.city || "N/A"}, ${order.shippingAddress.district || "N/A"}`,
        `${order.shippingAddress.state || "N/A"} - ${order.shippingAddress.pincode || "N/A"}`,
        order.shippingAddress.phone || "N/A",
      ].filter((line) => line !== "N/A");

      // Calculate heights for bill section
      let billHeight = 0;
      billLines.forEach((line) => {
        billHeight += doc.heightOfString(line, { width: 200 }) + 5;
      });
      if (billLines.length > 0) billHeight -= 5;

      // Calculate heights for ship section
      let shipHeight = 0;
      shipLines.forEach((line) => {
        shipHeight += doc.heightOfString(line, { width: 200 }) + 5;
      });
      if (shipLines.length > 0) shipHeight -= 5;

      // Determine card height: max of bill/ship heights + header (15 + 20 padding)
      const cardHeight = Math.max(billHeight, shipHeight) + 35;

      // Draw the card with dynamic height
      drawCard(CONFIG.MARGINS.left, startY, 510, cardHeight);

      // Render headers
      doc
        .fillColor(CONFIG.COLORS.PRIMARY)
        .fontSize(CONFIG.SIZES.SUBTITLE)
        .font(CONFIG.FONTS.BOLD)
        .text("BILL TO:", leftCol, startY + 15)
        .text("SHIP TO:", rightCol, startY + 15);

      doc.fontSize(CONFIG.SIZES.REGULAR).font(CONFIG.FONTS.REGULAR).fillColor(CONFIG.COLORS.SECONDARY);

      // Render bill lines with dynamic positioning
      let billY = startY + 35;
      billLines.forEach((line) => {
        const options = { width: 200, align: "left" };
        const height = doc.heightOfString(line, options);
        doc.text(line, leftCol, billY, options);
        billY += height + 5;
      });

      // Render ship lines with dynamic positioning
      let shipY = startY + 35;
      shipLines.forEach((line) => {
        const options = { width: 200, align: "left" };
        const height = doc.heightOfString(line, options);
        doc.text(line, rightCol, shipY, options);
        shipY += height + 5;
      });

      // Return the next startY based on dynamic card height
      return startY + cardHeight + 20;
    };

    // Add products table
    const addProductsTable = (startY) => {
      const tableTop = startY;
      const tableLeft = CONFIG.MARGINS.left;
      const tableWidth = 510;
      const rowHeight = 25;
      const headerHeight = 30;

      // Table header
      drawCard(tableLeft, tableTop, tableWidth, headerHeight);

      doc.fillColor(CONFIG.COLORS.PRIMARY).fontSize(CONFIG.SIZES.REGULAR).font(CONFIG.FONTS.BOLD);

      const headers = ["#", "PRODUCT", "COLOR", "QTY", "RATE", "AMOUNT"];
      const colWidths = [30, 180, 80, 50, 80, 80];
      let xPos = tableLeft + 10;

      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop + 10, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      // Table rows
      let yPos = tableTop + headerHeight;
      doc.font(CONFIG.FONTS.REGULAR).fontSize(CONFIG.SIZES.REGULAR);

      order.products.forEach((product, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(tableLeft, yPos, tableWidth, rowHeight).fillOpacity(0.3).fill(CONFIG.COLORS.NEUTRAL).fillOpacity(1);
        }

        xPos = tableLeft + 10;
        const rowData = [
          (index + 1).toString(),
          product.productId?.name || "N/A",
          product.selectedColor || "N/A",
          product.quantity?.toString() || "0",
          `₹${(product.priceAtPurchase || 0).toLocaleString("en-IN")}`,
          `₹${(product.productTotal || 0).toLocaleString("en-IN")}`,
        ];

        rowData.forEach((data, i) => {
          doc.fillColor(CONFIG.COLORS.SECONDARY).text(data, xPos, yPos + 8, {
            width: colWidths[i] - 10,
            ellipsis: true,
          });
          xPos += colWidths[i];
        });

        yPos += rowHeight;
      });

      // Table border
      doc
        .rect(tableLeft, tableTop, tableWidth, yPos - tableTop)
        .lineWidth(1)
        .stroke(CONFIG.COLORS.BORDER);

      return yPos + 20;
    };

    // Add totals
    const addTotals = (startY) => {
      const rightAlign = 450;
      const labelCol = 350;
      drawCard(CONFIG.MARGINS.left, startY, 510, 80);

      doc.fillColor(CONFIG.COLORS.SECONDARY).fontSize(CONFIG.SIZES.REGULAR).font(CONFIG.FONTS.REGULAR);

      const subtotal = order.products.reduce((sum, p) => sum + (p.productTotal || 0), 0);
      const discount = order.couponDetails ? order.couponDetails.discount || 0 : 0;

      // Subtotal
      doc.text("Subtotal:", labelCol, startY + 15).text(`₹${subtotal.toLocaleString("en-IN")}`, rightAlign, startY + 15, {
        align: "right",
      });

      // Discount (if applicable)
      let yOffset = 15;
      if (discount > 0) {
        doc
          .text(`Discount (${order.couponDetails.code}):`, labelCol, startY + 30)
          .text(`-₹${discount.toLocaleString("en-IN")}`, rightAlign, startY + 30, {
            align: "right",
          });
        yOffset += 15;
      }

      // Total line
      doc.rect(labelCol, startY + yOffset + 10, 160, 1).fill(CONFIG.COLORS.BORDER);

      // Total amount
      doc
        .fontSize(CONFIG.SIZES.SUBTITLE)
        .font(CONFIG.FONTS.BOLD)
        .fillColor(CONFIG.COLORS.PRIMARY)
        .text("TOTAL:", labelCol, startY + yOffset + 20)
        .text(`₹${(order.totalAmount || 0).toLocaleString("en-IN")}`, rightAlign, startY + yOffset + 20, { align: "right" });

      return startY + yOffset + 50;
    };

    // Add footer
    const addFooter = () => {
      const footerY = 700;
      drawCard(CONFIG.MARGINS.left, footerY - 50, 510, 80);

      doc
        .fillColor(CONFIG.COLORS.SECONDARY)
        .fontSize(CONFIG.SIZES.SMALL)
        .font(CONFIG.FONTS.REGULAR)
        .text("Terms & Conditions:", CONFIG.MARGINS.left + 15, footerY - 35)
        .text("1. All sales are final.", CONFIG.MARGINS.left + 15, footerY - 25)
        .text("2. Products are covered under manufacturer warranty.", CONFIG.MARGINS.left + 15, footerY - 15)
        .text("3. For support, contact us at support@veltron.com", CONFIG.MARGINS.left + 15, footerY - 5);

      doc
        .fillColor(CONFIG.COLORS.PRIMARY)
        .fontSize(CONFIG.SIZES.SUBTITLE)
        .font(CONFIG.FONTS.BOLD)
        .text("Thank you for choosing Veltron!", CONFIG.MARGINS.left, footerY + 15, {
          align: "center",
          width: 510,
        });

      doc
        .fillColor(CONFIG.COLORS.SECONDARY)
        .fontSize(CONFIG.SIZES.SMALL)
        .font(CONFIG.FONTS.REGULAR)
        .text("This is a computer-generated invoice and does not require a signature.", CONFIG.MARGINS.left, footerY + 35, {
          align: "center",
          width: 510,
        });
    };

    // Generate the invoice
    addHeader();
    let currentY = 130;
    currentY = addInvoiceDetails(currentY);
    currentY = addBillingDetails(currentY);
    currentY = addProductsTable(currentY);
    currentY = addTotals(currentY);
    addFooter();

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Generate invoice error:", error);
    res.status(500).json({
      message: "Failed to generate invoice",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

module.exports = { generateInvoice };
