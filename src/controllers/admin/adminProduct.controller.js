const Product = require('../../models/common/productSchema');
const { success, error: errorResponse } = require('../../helpers/responseHelper');
const HttpStatus = require('../../constants/statusCodes');
const PermissionStatus = require('../../constants/permissionStatus');
const Messages = require('../../constants/messages');

const loadProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 5;
    const skip = (page - 1) * limit;
    const products = await Product.find({approvalStatus:{ $ne: PermissionStatus.PENDING }}).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("category").populate("vendorId").lean();
    const totalProducts = await Product.countDocuments({approvalStatus:{ $ne: PermissionStatus.PENDING }});

    res.render('admin/products', {
      layout: 'layouts/adminLayout',
      activePage: 'products',
      admin: req.admin,
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    console.error('Error loading products:', error);
    res.redirect('/admin/dashboard');
  }
};

const listAndUnlist = async (req, res) => {
    try {
        const id = req.params.id;
        const { approvalStatus } = req.body;
        
        const product = await Product.findById(id);
        if (!product) {
            return errorResponse(res, HttpStatus.NOT_FOUND, Messages.PRODUCT_NOT_FOUND);
        }
        // Update 
        await Product.findByIdAndUpdate(id, { approvalStatus: approvalStatus.toLowerCase() });
        
        return success(res, HttpStatus.OK);
    } catch (error) {
        console.error('Error in listAndUnlist:', error);
        return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
    }
};

const loadProductsPendings = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 5;
    const skip = (page - 1) * limit;
    const products = await Product.find({ approvalStatus: PermissionStatus.PENDING }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("category").populate("vendorId").lean();
    const totalProducts = await Product.countDocuments({ approvalStatus: PermissionStatus.PENDING });

    res.render('admin/productPendings', {
      layout: 'layouts/adminLayout',
      activePage: 'products',
      admin: req.admin,
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    console.error('Error loading pending products:', error);
    res.redirect('/admin/products');
  }
};

const approveProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, HttpStatus.NOT_FOUND, Messages.PRODUCT_NOT_FOUND);
    }
    product.approvalStatus = "approved";
    await product.save();
    return success(res, HttpStatus.OK, Messages.PRODUCT_UPDATED);
  } catch (error) {
    console.error("Error approving product:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const rejectProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, HttpStatus.FORBIDDEN, Messages.PRODUCT_NOT_FOUND);
    }
    product.approvalStatus = "rejected";
    await product.save();
    return success(res, HttpStatus.OK, Messages.PRODUCT_UPDATED);
  } catch (error) {
    console.error("Error rejecting product:", error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);  }
};

module.exports={
    loadProducts,
    listAndUnlist,
    loadProductsPendings,
    approveProduct,
    rejectProduct,
}

