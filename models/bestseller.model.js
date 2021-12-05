const mongoose = require('mongoose');

const bestSellerSchema = new mongoose.Schema({
    product: {
        type: String,
        trim: true
    },
    times: {
        type: Number,
        default: 1,
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const BestSeller = mongoose.model("BestSeller", bestSellerSchema)
module.exports = BestSeller