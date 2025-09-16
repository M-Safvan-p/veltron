const Product = require("../../models/common/productSchema");
const Category = require("../../models/common/categorySchema");

const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");
const { success, error: errorResponse } = require("../../helpers/responseHelper");

// const getProducts = async (req, res) => {
//   try {
//     const { search, category, maxPrice, strapStyle, sort, page = 1 } = req.query;
//     const limit = 10;
//     const skip = (parseInt(page) - 1) * limit;

//     let query = { isListed: true, approvalStatus: 'approved' };

//     // case senstive and prevent attack
//     const sanitizedSearch = search ? search.replace(/[<>]/g, '') : '';
//     if (sanitizedSearch) {
//       query.name = { $regex: sanitizedSearch, $options: 'i' }; // Case-insensitive
//     }

//     // Filter by multiple categories
//     if (category) {
//       const categories = Array.isArray(category) ? category : [category];
//       query.category = { $in: categories };
//     }

//     // Filter by multiple strap styles
//     if (strapStyle) {
//       const styles = Array.isArray(strapStyle) ? strapStyle : [strapStyle];
//       query['specifications.strapStyle'] = { $in: styles };
//     }

//     // Filter by price
//     if (maxPrice && maxPrice !== '10000') {
//       query.$or = [
//         { discountedPrice: { $lte: parseFloat(maxPrice) } },
//         { price: { $lte: parseFloat(maxPrice), discountedPrice: { $exists: false } } }
//       ];
//     }

//     // Sort products
//     let sortOption = {};
//     switch (sort) {
//       case 'price-low':
//         sortOption = { discountedPrice: 1, price: 1 };
//         break;
//       case 'price-high':
//         sortOption = { discountedPrice: -1, price: -1 };
//         break;
//       case 'newest':
//         sortOption = { createdAt: -1 };
//         break;
//       case 'featured':
//       default:
//         sortOption = { createdAt: -1 }; // Default to newest
//     }

//     // Fetch categories
//     const categories = await Category.find().lean();

//     // Fetch unique strap styles efficiently
//     const strapStyles = await Product.distinct('specifications.strapStyle', {
//       isListed: true,
//       approvalStatus: 'approved',
//       'specifications.strapStyle': { $exists: true, $ne: null }
//     });

//     // Fetch products
//     const products = await Product.find(query)
//       .populate('category')
//       .populate('vendorId')
//       .sort(sortOption)
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     // Enrich products with stock information
//     const enrichedProducts = products.map(product => {
//       const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
//       return {
//         ...product,
//         isOutOfStock: product.productStatus === 'out-of-stock' || totalStock === 0,
//         totalStock
//       };
//     });

//     // Count total products for pagination
//     const totalProducts = await Product.countDocuments(query);
//     const totalPages = Math.ceil(totalProducts / limit) || 1;

//     // Render EJS
//     res.render('user/productList', {
//       layout: 'layouts/userLayout',
//       products: enrichedProducts,
//       categories,
//       strapStyles,
//       currentPage: parseInt(page) || 1,
//       totalPages,
//       totalProducts,
//       query: req.query
//     });
//   } catch (error) {
//     console.error('Error in getProducts:', error);
//     res.status(500).render('error', {
//       layout: 'layouts/userLayout',
//       message: 'Unable to load products. Please try again later.',
//       error
//     });
//   }
// };

const getProducts = async (req, res) => {
  try {
    // Extract query parameters from the URL
    const { search, category, priceRange, sort, page = 1 } = req.query;

    // Set how many products to show per page
    const limit = 12;

    // Calculate how many products to skip (for pagination)
    const skip = (parseInt(page) - 1) * limit;

    // Start building our database query - only show approved and listed products
    let query = {
      isListed: true,
      approvalStatus: "approved",
      productStatus: { $ne: "Discontinued" }, // Don't show discontinued products
    };

    // SEARCH FUNCTIONALITY
    // Clean the search input to prevent malicious code
    const sanitizedSearch = search ? search.replace(/[<>]/g, "").trim() : "";
    if (sanitizedSearch) {
      // Search in product name and description (case-insensitive)
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { description: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    // CATEGORY FILTERING
    // Handle both single category and multiple categories
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      query.category = { $in: categories };
    }

    // PRICE RANGE FILTERING
    // Filter products based on selected price range
    if (priceRange) {
      let minPrice, maxPrice;

      // Convert price range string to actual numbers
      switch (priceRange) {
        case "100-1000":
          minPrice = 100;
          maxPrice = 1000;
          break;
        case "1000-2000":
          minPrice = 1000;
          maxPrice = 2000;
          break;
        case "2000-5000":
          minPrice = 2000;
          maxPrice = 5000;
          break;
        case "5000-10000":
          minPrice = 5000;
          maxPrice = 10000;
          break;
        case "10000+":
          minPrice = 10000;
          maxPrice = 999999999; // Very large number for "10000+"
          break;
      }

      // Apply price filter - check both regular price and discounted price
      if (minPrice && maxPrice) {
        const priceCondition = {
          $or: [
            // If product has discount, check discounted price
            { discountedPrice: { $gte: minPrice, $lte: maxPrice } },
            // If no discount, check regular price
            {
              $and: [
                {
                  $or: [{ discountedPrice: { $exists: false } }, { discountedPrice: null }],
                },
                { price: { $gte: minPrice, $lte: maxPrice } },
              ],
            },
          ],
        };
        query.$and = query.$and || [];
        query.$and.push(priceCondition);
      }
    }

    // SORTING OPTIONS
    // Define how to sort the products
    let sortOption = {};
    switch (sort) {
      case "price-low":
        // Sort by price: lowest first (consider discounted price first)
        sortOption = { discountedPrice: 1, price: 1 };
        break;
      case "price-high":
        // Sort by price: highest first (consider discounted price first)
        sortOption = { discountedPrice: -1, price: -1 };
        break;
      case "newest":
        // Sort by creation date: newest first
        sortOption = { createdAt: -1 };
        break;
      case "featured":
      default:
        // Default sorting: newest products first
        sortOption = { createdAt: -1 };
        break;
    }

    // FETCH DATA FROM DATABASE

    // Get all active categories for the filter sidebar
    const categories = await Category.find({ isListed: true })
      .select("name") // Only get the name field
      .sort({ name: 1 }) // Sort alphabetically
      .lean(); // Use lean() for better performance

    // Get products with all related information
    const products = await Product.find(query)
      .populate("category", "name") // Get category name
      .populate("vendorId", "brandName") // Get vendor brand name
      .sort(sortOption)
      .skip(skip) // Skip products for pagination
      .limit(limit) // Limit number of products
      .lean(); // Use lean() for better performance

    // ENRICH PRODUCTS WITH ADDITIONAL DATA
    // Add total stock calculation and out-of-stock status
    const enrichedProducts = products.map((product) => {
      // Calculate total stock from all variants
      const totalStock =
        product.variants?.reduce((sum, variant) => {
          return sum + (variant.stock || 0);
        }, 0) || 0;

      // Check if product is out of stock
      const isOutOfStock = product.productStatus === "out-of-stock" || totalStock === 0;

      return {
        ...product,
        totalStock,
        isOutOfStock,
      };
    });

    // PAGINATION CALCULATIONS
    // Count total products matching our filter
    const totalProducts = await Product.countDocuments(query);

    // Calculate total pages needed
    const totalPages = Math.ceil(totalProducts / limit) || 1;

    // RENDER THE PAGE
    // Send all data to the EJS template
    res.render("user/productList", {
      layout: "layouts/userLayout",
      title: "Premium Watch Collection",
      products: enrichedProducts,
      categories,

      // Pagination data
      currentPage: parseInt(page) || 1,
      totalPages,
      totalProducts,

      // Keep track of current filters for form state
      query: req.query,

      // Helper variables for pagination
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
      nextPage: parseInt(page) + 1,
      prevPage: parseInt(page) - 1,
    });
  } catch (error) {
    // Handle any errors that occur
    console.error("Error in getProducts:", error);

    // Show error page to user
    res.status(500).render("user/error", {
      layout: "layouts/userLayout",
      title: "Error",
      message: "Unable to load products. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error : {}, // Only show error details in development
    });
  }
};

const loadProductDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({
      _id: id,
      isListed: true,
      approvalStatus: "approved",
    })
      .populate("category vendorId")
      .lean();
    if (!product) return res.redirect("/sale");
    //related product
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: product.category._id,
      vendorId: product.vendorId._id,
      isListed: true,
      approvalStatus: "approved",
    })
      .limit(4)
      .lean();

    return res.render("user/productDetail", {
      layout: "layouts/userLayout",
      product,
      relatedProducts,
    });
  } catch (error) {
    console.log("Product detail page load error", error);
    return res.redirect("/sale");
  }
};

module.exports = {
  getProducts,
  loadProductDetail,
};
