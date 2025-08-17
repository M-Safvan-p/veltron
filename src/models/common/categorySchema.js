const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true 
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    categoryOffer:{
        type:Number,
        default:0,
    }
}, { timestamps: true }); 

module.exports = mongoose.model("Category", categorySchema);
