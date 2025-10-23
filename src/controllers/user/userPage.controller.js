const Product = require("../../models/common/productSchema");
const Contact = require("../../models/common/contactForm.schema");
const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");
const { error: errorResponse, success } = require("../../helpers/responseHelper");

const loadLanding = async (req, res) => {
  try {
    // new Arrivals
    const newArrivals = await Product.find({
      approvalStatus: "approved",
      isListed: true,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    // Trending
    const trending = await Product.find({
      approvalStatus: "approved",
      isListed: true,
    })
      .sort({ "variants.stock": -1 })
      .limit(3)
      .lean();
    //Explore More
    const exploreMore = await Product.find({
      approvalStatus: "approved",
      isListed: true,
    })
      .limit(4)
      .lean();

    res.render("user/landingpage", {
      newArrivals,
      trending,
      exploreMore,
      layout: false,
    });
  } catch (error) {
    console.log("landing page load error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadHome = async (req, res) => {
  try {
    // new Arrivals
    const newArrivals = await Product.find({
      approvalStatus: "approved",
      isListed: true,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    // Trending
    const trending = await Product.find({
      approvalStatus: "approved",
      isListed: true,
    })
      .sort({ "variants.stock": -1 })
      .limit(3)
      .lean();
    //Explore More
    const exploreMore = await Product.find({
      approvalStatus: "approved",
      isListed: true,
    })
      .limit(4)
      .lean();

    res.render("user/home", {
      newArrivals,
      trending,
      exploreMore,
      layout: "layouts/userLayout",
    });
  } catch (error) {
    console.log("Home page load error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadReferral = async (req, res) => {
  try {
    res.render("user/referral", {
      layout: "layouts/userLayout",
      currentPage: "referral",
      user: req.user,
      referralCode: req.user.referralCode,
    });
  } catch (error) {
    console.log("Referral page load error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadAbout = async (req, res) => {
  try {
    res.render("user/about", {
      layout: "layouts/userLayout",
    });
  } catch (error) {
    console.log("Referral page load error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const loadContact = async (req, res) => {
  try {
    res.render("user/contact", {
      layout: "layouts/userLayout",
    });
  } catch (error) {
    console.log("Referral page load error", error);
    return errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

const postContact = async (req, res) => {
  try {
    const { fullName, email, subject, message } = req.body;
    // save data
    const newContactForm = new Contact({
      fullName,
      email,
      subject,
      message
    });
    await newContactForm.save();
    success(res, HttpStatus.CREATED);
  } catch (error) {
    console.log("error when saving contact form",error);
    errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
  }
};

module.exports = {
  loadLanding,
  loadHome,
  loadReferral,
  loadAbout,
  loadContact,
  postContact,
};
