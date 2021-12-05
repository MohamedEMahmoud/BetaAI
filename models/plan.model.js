const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        lowercase: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        enum: ['USD', 'EGP'],
        required: true,
        trim: true,
        default: 'EGP'
    },
    features: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feature"
    }],
    time:{
        type: String,
        required: true,
        trim: true
    },
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })


planSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'plan'
})

const Plan = mongoose.model('Plan', planSchema)
module.exports = Plan