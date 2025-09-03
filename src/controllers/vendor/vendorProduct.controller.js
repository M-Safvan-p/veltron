const Product = require("../../models/common/productSchema");
const Category = require("../../models/common/categorySchema");
//const productValidationSchema = require("../validations/productValidation");// validation
const { success, error: errorResponsem} = require("../../helpers/responseHelper");
const Messages = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCodes");
const PermissionStatus = require("../../constants/permissionStatus");

const loadProducts = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = 5;
  let skip = (page - 1) * limit;
  // total products
  const totalProducts = await Product.countDocuments();
  // products
  const products = await Product.find()
    .skip(skip)
    .limit(limit)
    .populate("category");

  res.render("vendor/loadProducts", {
    layout: "layouts/vendorLayout",
    activePage: "products",
    vendor: req.vendor,
    products,
    currentPage: page,
    totalPages: Math.ceil(totalProducts / limit),
    totalProducts,
  });
};

const loadAddProduct = async (req, res) => {
  const category = await Category.find();
  res.render("vendor/loadAddProduct", {
    layout: "layouts/vendorLayout",
    activePage: "products",
    vendor: req.vendor,
    categories: category,
  });
};


const addProduct = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    // Basic fields
    const {name,description,price,discountedPrice,isListed,category,specifications} = req.body;

    // Validate required specifications
    if (!specifications || !specifications.strapStyle) {
      return res.status(400).json({
        success: false,
        message: "Specifications strapStyle is required",
      });
    }

    // Use variants directly from req.body (already parsed by multer)
    let variants = req.body.variants || [];

    // Vendor ID - adapt to how you store vendor (passport, session etc.)
    const vendorId = req.session.vendor;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Vendor not authenticated" });
    }

    // Process each variant and upload images
    const processedVariants = [];

    for (const [i, variant] of variants.entries()) {
      // Validate color
      if (!variant.color || variant.color.trim() === "") {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1} requires a color (please enter a color name)`,
        });
      }

      // Get files for this variant by matching fieldnames
      const variantFiles = req.files.filter(file =>
        file.fieldname.startsWith(`variants[${i}][images]`)
      );

      const uploadedImages = [];

      for (const file of variantFiles) {
        try {
          // Cloudinary multer storage provides path (URL) and filename (public_id)
          const url = file.path;
          const public_id = file.filename;

          if (!url || !public_id) {
            console.error(`Missing URL or public_id for variant ${i + 1}:`, { url, public_id });
            return res.status(400).json({
              success: false,
              message: `Failed to upload image for variant ${i + 1} to Cloudinary`,
            });
          }

          uploadedImages.push({
            url,
            public_id,
            filename: file.originalname || "unknown",
          });
        } catch (uploadError) {
          console.error(
            `Error processing image for variant ${i + 1}:`,
            uploadError
          );
          return res.status(500).json({
            success: false,
            message: `Failed to process images for variant ${i + 1}`,
          });
        }
      }

      // Validate at least one image per variant
      if (uploadedImages.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1} requires at least one image`,
        });
      }

      // Create the processed variant with uploaded images
      processedVariants.push({
        color: variant.color,
        stock: Number(variant.stock) || 0,
        images: uploadedImages,
      });
    }

    console.log("Parsed Variants:", JSON.stringify(variants, null, 2));
    //Create new product
    const newProduct = new Product({
      vendorId: vendorId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
      isListed: isListed === "true",
      category: category.trim(),
      specifications: specifications,
      variants: processedVariants, 
    });

    await newProduct.save();

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      productId: newProduct._id,
    });

  } catch (err) {
    console.error("Add product error:", err);

    // Handle duplicate key errors or other MongoDB errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while adding product",
    });
  }
};

module.exports = {
  loadProducts,
  loadAddProduct,
  addProduct,
};
