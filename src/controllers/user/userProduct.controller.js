const Product = require('../../models/common/productSchema');
const Category = require('../../models/common/categorySchema');
const Vendor = require('../../models/vendor/vendorSchema');

const HttpStatus = require('../../constants//statusCodes');
const Messages = require('../../constants/messages');
const { success, error: errorResponse } = require('../../helpers/responseHelper');


const getProducts = async (req, res) => {
  try {
    const { search, category, maxPrice, strapStyle, sort, page = 1 } = req.query;
    const limit = 10; 
    const skip = (parseInt(page) - 1) * limit;
    
    let query = { isListed: true, approvalStatus: 'approved' };

    // case senstive and prevent attack
    const sanitizedSearch = search ? search.replace(/[<>]/g, '') : '';
    if (sanitizedSearch) {
      query.name = { $regex: sanitizedSearch, $options: 'i' }; // Case-insensitive
    }

    // Filter by multiple categories
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      query.category = { $in: categories };
    }

    // Filter by multiple strap styles
    if (strapStyle) {
      const styles = Array.isArray(strapStyle) ? strapStyle : [strapStyle];
      query['specifications.strapStyle'] = { $in: styles };
    }

    // Filter by price
    if (maxPrice && maxPrice !== '10000') {
      query.$or = [
        { discountedPrice: { $lte: parseFloat(maxPrice) } },
        { price: { $lte: parseFloat(maxPrice), discountedPrice: { $exists: false } } }
      ];
    }

    // Sort products
    let sortOption = {};
    switch (sort) {
      case 'price-low':
        sortOption = { discountedPrice: 1, price: 1 };
        break;
      case 'price-high':
        sortOption = { discountedPrice: -1, price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'featured':
      default:
        sortOption = { createdAt: -1 }; // Default to newest
    }

    // Fetch categories
    const categories = await Category.find().lean();

    // Fetch unique strap styles efficiently
    const strapStyles = await Product.distinct('specifications.strapStyle', {
      isListed: true,
      approvalStatus: 'approved',
      'specifications.strapStyle': { $exists: true, $ne: null }
    });

    // Fetch products
    const products = await Product.find(query)
      .populate('category')
      .populate('vendorId')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich products with stock information
    const enrichedProducts = products.map(product => {
      const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
      return {
        ...product,
        isOutOfStock: product.productStatus === 'out-of-stock' || totalStock === 0,
        totalStock
      };
    });

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit) || 1;

    // Render EJS
    res.render('user/productList', {
      layout: 'layouts/userLayout',
      products: enrichedProducts,
      categories,
      strapStyles,
      currentPage: parseInt(page) || 1,
      totalPages,
      totalProducts,
      query: req.query 
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).render('error', {
      layout: 'layouts/userLayout',
      message: 'Unable to load products. Please try again later.',
      error
    });
  }
};


const loadProductDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id, isListed: true, approvalStatus: 'approved' }).populate('category vendorId').lean();
    if (!product) return res.redirect('/sale');
    //related product
    const relatedProducts = await Product.find({ _id: { $ne: id }, category: product.category._id, vendorId: product.vendorId._id, isListed: true, approvalStatus: 'approved' })
      .limit(4)
      .lean();

    return res.render('user/productDetail', { layout: 'layouts/userLayout', product, relatedProducts });
  } catch (error) {
    console.log('Product detail page load error', error);
    return res.redirect('/sale');
  }
};

module.exports = {
  getProducts,
  loadProductDetail,
};
