const Product = require("../../models/common/productSchema");
const Category = require("../../models/common/categorySchema");
const Vendor = require("../../models/vendor/vendorSchema");

const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");
const { success, error: errorResponse } = require("../../helpers/responseHelper");

const getProducts = async (req, res) => {
  try {
    const { search, category, vendor, priceRange, sort, page = 1 } = req.query;
    const limit = 10;
    const skip = (parseInt(page) - 1) * limit;

    let query = {
      isListed: true,
      approvalStatus: "approved",
      productStatus: { $ne: "Discontinued" },
    };

    // Search
    const sanitizedSearch = search ? search.replace(/[<>]/g, "").trim() : "";
    if (sanitizedSearch) {
      query.$or = [{ name: { $regex: sanitizedSearch, $options: "i" } }, { description: { $regex: sanitizedSearch, $options: "i" } }];
    }

    // Category filtering
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      query.category = { $in: categories };
    }

    // Vendor filtering
    if (vendor) {
      const vendors = Array.isArray(vendor) ? vendor : [vendor];
      query.vendorId = { $in: vendors };
    }

    // Price range filtering
    if (priceRange) {
      let minPrice, maxPrice;
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
          maxPrice = 999999999;
          break;
      }

      if (minPrice && maxPrice) {
        const priceCondition = {
          $or: [
            { discountedPrice: { $gte: minPrice, $lte: maxPrice } },
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

    // Sorting
    let sortOption = {};
    switch (sort) {
      case "A-Z":
        sortOption = { name: 1 };
        break;
      case "Z-A":
        sortOption = { name: -1 };
        break;
      case "price-low":
        sortOption = { discountedPrice: 1, price: 1 };
        break;
      case "price-high":
        sortOption = { discountedPrice: -1, price: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: 1 };
        break;
    }

    const categories = await Category.find({ isListed: true }).select("name").sort({ name: 1 }).lean();

    const vendors = await Vendor.find({
      isBlocked: false,
      permissionStatus: "approved",
    })
      .select("brandName")
      .sort({ brandName: 1 })
      .lean();

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("vendorId", "brandName")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const enrichedProducts = products.map((product) => {
      const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;

      const isOutOfStock = product.productStatus === "out-of-stock" || totalStock === 0;

      return {
        ...product,
        totalStock,
        isOutOfStock,
      };
    });

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit) || 1;

    res.render("user/productList", {
      layout: "layouts/userLayout",
      title: "Premium Watch Collection",
      products: enrichedProducts,
      categories,
      vendors,
      currentPage: parseInt(page) || 1,
      totalPages,
      totalProducts,
      query: req.query,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
      nextPage: parseInt(page) + 1,
      prevPage: parseInt(page) - 1,
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    res.status(500).render("user/error", {
      layout: "layouts/userLayout",
      title: "Error",
      message: "Unable to load products. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error : {},
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
      isListed: true,
      approvalStatus: "approved",
    })
      .populate("category")
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
