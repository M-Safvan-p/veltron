const Customer = require("../../models/user/userSchema");
const {success, error:errorResponse} = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");

const loadCustomers = async (req, res)=> {
    try {
        const page = parseInt(req.query.page || 1);
        const limit = 5;
        const skip = (page - 1) * limit;

        const customers = await Customer.find().sort({createdAt:-1}).skip(skip).limit(limit).populate("wallet").lean();
        const totalCustomers = await Customer.countDocuments();
    
        res.render("admin/customers",{
            layout:"layouts/adminLayout",
            activePage:"customers",
            admin:req.admin,
            customers,
            totalCustomers,
            currentPage:page,
            totalPages:Math.ceil(totalCustomers / limit),
        });
    } catch (error) {
     console.log("customers loading error",error);
     res.redirect("/admin/dashboard");   
    }
}

const blockAndUnblock = async (req, res)=>{
    try {
        const id = req.params.id;
        const isBlocked = req.body.isBlocked === true || req.body.isBlocked === "true";
        //find
        const user = Customer.findById(id);
        if(!user)return errorResponse(res, HttpStatus.BAD_REQUEST, Messages.LOGIN_USER_NOT_FOUND);
        //change
        await Customer.findByIdAndUpdate(id, { isBlocked });
        //session clear if login
        req.session.user=null;
        return success(res, HttpStatus.OK); 
    } catch (error) {
        errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, Messages.SERVER_ERROR);
    }
};

module.exports = {
    loadCustomers,
    blockAndUnblock,
    
}