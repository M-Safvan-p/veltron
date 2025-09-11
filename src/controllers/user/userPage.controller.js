const Product = require("../../models/common/productSchema");

const HttpStatus = require("../../constants//statusCodes");
const Messages = require("../../constants/messages");
const {success, error:errorResponse} = require("../../helpers/responseHelper");


const loadLanding = async(req, res) => {
  try {
    // new Arrivals
    const newArrivals = await Product.find({ approvalStatus: 'approved', isListed: true })
    .sort({ createdAt: -1 }).limit(3).lean();
    // Trending 
    const trending = await Product.find({ approvalStatus: 'approved', isListed: true })
    .sort({ 'variants.stock': -1 }) .limit(3).lean();
    //Explore More
    const exploreMore = await Product.find({ approvalStatus: 'approved', isListed: true })
    .limit(4).lean();

    res.render("user/landingpage",{newArrivals, trending, exploreMore, layout: false});
  } catch (error) {
    console.log("landing page load error");
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR)
  }
};

const loadHome = async (req, res) => {
  try {
    // new Arrivals
    const newArrivals = await Product.find({ approvalStatus: 'approved', isListed: true })
    .sort({ createdAt: -1 }).limit(3).lean();
    // Trending 
    const trending = await Product.find({ approvalStatus: 'approved', isListed: true })
    .sort({ 'variants.stock': -1 }) .limit(3).lean();
    //Explore More
    const exploreMore = await Product.find({ approvalStatus: 'approved', isListed: true })
    .limit(4).lean();

    res.render("user/home",{newArrivals, trending, exploreMore, layout:"layouts/userLayout"});
  }catch (error){
    console.log("Home page load error");
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR)
  }
};





module.exports = {
    loadLanding,
    loadHome,
}