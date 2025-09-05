const Customers = require("../../models/user/userSchema");
const {success, error:errorResponse} = require("../../helpers/responseHelper");
const HttpStatus = require("../../constants/statusCodes");
const Messages = require("../../constants/messages");

const loadCustomers = async (req, res)=> {
    try {
        const page = parseInt(req.query.page || 1);
        const limit = 5;
        const skip = (page - 1) * limit;

        const customers = await Customers.find().sort({createdAt:-1}).skip(skip).limit(limit).populate("wallet");
        const totalCustomers = await Customers.countDocuments();
    
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




module.exports = {
    loadCustomers,
    
}