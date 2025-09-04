const Vendor = require("../models/vendor/vendorSchema");

const checkSession = async (req,res,next)=>{
    if (req.session.vendor) {
        const vendor = await Vendor.findById(req.session.vendor);
        req.vendor = vendor;
        return next();
    }
    else {
        return res.redirect("/vendor/");
    }
}

const isLogin = async (req,res,next)=>{
    if(req.session.vendor){
        const vendor = await Vendor.findById(req.session.vendor);
        req.vendor = vendor;
        return res.redirect("/vendor/dashboard");
    }
    return next();
}




module.exports = {
    checkSession,
    isLogin
}