const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    address: [{
        fullName: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        fullAddress: {
            type: String,
            required: true, 
        },
        district: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
        landMark: {
            type: String,
            required:false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        }
    }]
}); 

module.exports = mongoose.model("Address", addressSchema);
