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
    const products = await Product.find({approvalStatus:{ $ne: PermissionStatus.PENDING }}).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("category").populate("vendorId");
    const totalProducts = await Product.countDocuments({approvalStatus:{ $ne: PermissionStatus.PENDING }});

    res.render('admin/products', {
      layout: 'layouts/adminLayout',
      activePage: 'prodcuts',
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
        await Product.findByIdAndUpdate(id, { approvalStatus: approvalStatus });
        
        return success(res, HttpStatus.OK);
    } catch (error) {
        console.error('Error in listAndUnlist:', error);
        return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
    }
}

module.exports={
    loadProducts,
    listAndUnlist,
}

