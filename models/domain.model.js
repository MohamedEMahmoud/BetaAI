const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema({
    domain:{
        type: String,
        required: true,
        trim: true
    },
    discount:{
        type: Number,
        required: true,
        trim: true
    },
    about:{
        type: String,
        required: true,
        trim: true
    },
    time:{
        type: String,
        trim: true
    },
    end_in:{
        type:Date,
    },
    active:{
        type: Boolean,
        default: true
    },
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })


const Domain = mongoose.model('Domain' , domainSchema)
module.exports = Domain
