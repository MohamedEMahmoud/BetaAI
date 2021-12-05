const mongoose = require('mongoose')

const cardUserSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    number: {
        iv: {
            type: String,
            required: true, 
            unique: true
        },
        content: {
            type: String,
            required: true,
            unique: true
        }
    },
    exp_month: {
        type: String,
        required: true,
        uniq: true,
        trim: true
    },
    exp_year: {
        type: String,
        required: true,
        uniq: true,
        trim: true
    },
    cvc: {
        iv: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        }
    },
    last4: {
        type: Number,
        required: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    fingerprint: {
        type: String,
        required: true,
        trim: true
    },
    funding: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    stripeCardId: {
        type: String,
        required: true,
        trim: true
    },
    stripeCustomerId: {
        type: String,
        required: true,
        trim: true
    },
    clientIp: {
        type: String,
        trim: true
    },
    token:{
        type:Array
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


const CardUser = mongoose.model("CardUser", cardUserSchema)
module.exports = CardUser