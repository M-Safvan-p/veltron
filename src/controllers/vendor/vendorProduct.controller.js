const mongoose = require('mongoose');
const Product = require('../../models/common/productSchema');
const Category = require('../../models/common/categorySchema');
const { success, error: errorResponse } = require('../../helpers/responseHelper');
const Messages = require('../../constants/messages');
const HttpStatus = require('../../constants/statusCodes');

const loadProducts = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = 5;
  let skip = (page - 1) * limit;
  // total products
  const totalProducts = await Product.countDocuments({ vendorId: req.session.vendor });
  // products
  const products = await Product.find({ vendorId: req.session.vendor }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('category').lean();

  res.render('vendor/loadProducts', {
    layout: 'layouts/vendorLayout',
    activePage: 'products',
    vendor: req.vendor,
    products,
    currentPage: page,
    totalPages: Math.ceil(totalProducts / limit),
    totalProducts,
  });
};

const listAndUnlist = async (req, res) => {
  try {
    const id = req.params.id;
    const { isListed } = req.body;
    await Product.findByIdAndUpdate({ _id: id, vendor: req.session.vendor }, { isListed });
    return success(res, HttpStatus.OK);
  } catch (error) {
    console.error('Error while update product:', error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadAddProduct = async (req, res) => {
  const category = await Category.find().lean();
  res.render('vendor/loadAddProduct', {
    layout: 'layouts/vendorLayout',
    activePage: 'products',
    vendor: req.vendor,
    categories: category,
  });
};

const addProduct = async (req, res) => {
  try {
    // console.log("Request body:", req.body);
    // console.log("Request files:", req.files);

    const { name, description, price, discountedPrice, isListed, category, variants, specifications } = req.body;
    // Validate
    const find = await Product.findOne({ name });
    if (find) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_ALREADY_EXISTS);
    // vendor id
    const vendorId = req.session.vendor;
    if (!vendorId) return errorResponse(res, HttpStatus.UNAUTHORIZED, Messages.VENDOR_NOT_FOUND);

    // Convert variants object to array if necessary (multer parses as object with string keys)
    if (variants && typeof variants === 'object' && !Array.isArray(variants)) {
      variants = Object.keys(variants).sort().map(key => variants[key]);
    }

    // Process each variant and upload images
    const processedVariants = [];

    for (const [i, variant] of variants.entries()) {
      // Validate color
      if (!variant.color || variant.color.trim() === '') return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VARIANT_COLOR_REQUIRED(i + 1));

      // Get files for this variant by matching fieldnames
      const variantFiles = req.files.filter(file => file.fieldname.startsWith(`variants[${i}][images]`));

      const uploadedImages = [];

      for (const file of variantFiles) {
        try {
          const url = file.path;
          const public_id = file.filename;

          if (!url || !public_id) {
            console.error(`Missing URL or public_id for variant ${i + 1}:`, { url, public_id });
            return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.VARIANT_IMAGE_UPLOAD_FAILED(i + 1));
          }

          uploadedImages.push({
            url,
            public_id,
            filename: file.originalname || 'unknown',
          });
        } catch (uploadError) {
          console.error(`Error processing image for variant ${i + 1}:`, uploadError);
          return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.VARIANT_IMAGE_PROCESS_FAILED(i + 1));
        }
      }

      //Check images
      if (uploadedImages.length < 3) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VARIANT_IMAGE_REQUIRED(i + 1));

      // Create the processed variant with uploaded images
      processedVariants.push({
        color: variant.color.trim(),
        stock: Number(variant.stock.toString().trim()) || 0,
        images: uploadedImages,
      });
    }

    //Create new product
    const newProduct = new Product({
      vendorId: vendorId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
      isListed: isListed == 'true',
      category: category.trim(),
      specifications: specifications,
      variants: processedVariants,
    });
    console.log('save', newProduct);
    //SAVE
    await newProduct.save();

    return success(res, HttpStatus.CREATED, Messages.PRODUCT_ADDED);
  } catch (err) {
    console.error('Add product error:', err);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.redirect('/vendor/products');

    const categories = await Category.find().lean();
    const product = await Product.findOne({ _id: id, vendorId: req.session.vendor }).populate('category').lean();
    if (!product) return res.redirect('/vendor/products');

    res.render('vendor/loadEditProduct', {
      layout: 'layouts/vendorLayout',
      activePage: 'products',
      vendor: req.vendor,
      categories,
      product,
    });
  } catch (error) {
    console.error('Error loading product edit page:', error);
    return res.redirect('/vendor/products');
  }
};

const editProduct = async (req, res) => {
  try {
    // console.log("Request body:", req.body);
    // console.log("Request files:", req.files);
    const productId = req.params.id;
    // id check
    if (!mongoose.Types.ObjectId.isValid(productId)) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.INVALID_PRODUCT_ID);
    //vendor
    const vendorId = req.session.vendor;
    if (!vendorId) return errorResponse(res, HttpStatus.UNAUTHORIZED, Messages.VENDOR_NOT_FOUND);

    const { name, description, price, discountedPrice, isListed, category, variants, specifications } = req.body;

    // Convert variants object to array if necessary (multer parses as object with string keys)
    if (variants && typeof variants === 'object' && !Array.isArray(variants)) {
      variants = Object.keys(variants).sort().map(key => variants[key]);
    }

    // old product
    const existingProduct = await Product.findOne({ _id: productId, vendorId: vendorId });
    if (!existingProduct) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.PRODUCT_NOT_FOUND);
    }

    // name check without this (editing)
    const duplicateProduct = await Product.findOne({ name: name.trim(), _id: { $ne: productId } });
    if (duplicateProduct) {
      return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.PRODUCT_ALREADY_EXISTS);
    }

    // Process each variant and upload images
    const processedVariants = [];

    for (const [i, variant] of variants.entries()) {
      // Validate color
      if (!variant.color || variant.color.trim() === '') return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VARIANT_COLOR_REQUIRED(i + 1));

      // Get files for this variant by matching fieldnames
      const variantFiles = req.files.filter(file => file.fieldname.startsWith(`variants[${i}][images]`));

      let uploadedImages = [];

      if (variantFiles.length > 0) {
        for (const file of variantFiles) {
          try {
            const url = file.path;
            const public_id = file.filename;

            if (!url || !public_id) {
              console.error(`Missing URL or public_id for variant ${i + 1}:`, { url, public_id });
              return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.VARIANT_IMAGE_UPLOAD_FAILED(i + 1));
            }

            uploadedImages.push({
              url,
              public_id,
              filename: file.originalname || 'unknown',
            });
          } catch (uploadError) {
            console.error(`Error processing image for variant ${i + 1}:`, uploadError);
            return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.VARIANT_IMAGE_PROCESS_FAILED(i + 1));
          }
        }

        // Check images
        if (uploadedImages.length < 3) return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VARIANT_IMAGE_REQUIRED(i + 1));
      } else {
        // Keep existing images if no new ones uploaded
        if (existingProduct.variants[i] && existingProduct.variants[i].images) {
          uploadedImages = existingProduct.variants[i].images;
        } else {
          return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VARIANT_IMAGE_REQUIRED(i + 1));
        }
      }

      // Create the processed variant with images
      processedVariants.push({
        color: variant.color.trim(),
        stock: Number(variant.stock.toString().trim()) || 0,
        images: uploadedImages,
      });
    }

    // Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, vendorId: vendorId },
      {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
        isListed: isListed == 'true',
        category: category.trim(),
        specifications: specifications,
        variants: processedVariants
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.PRODUCT_NOT_FOUND);
    }

    console.log("Product updated successfully:", updatedProduct._id);
    return success(res, HttpStatus.OK, Messages.PRODUCT_UPDATED);

  } catch (error) {
    console.error('Error edit product:', error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadProducts,
  listAndUnlist,
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
};
