const mongoose = require('mongoose')

const cardInstructorSchema = new mongoose.Schema({
    instructor: {
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
    currency: {
        type: String,
        required: true,
        trim: true
    },
    capabilities: {
        type: String,
        trim: true,
        default: 'inactive'
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
    stripeAccountId: {
        type: String,
        required: true,
        trim: true
    },
    clientIp: {
        type: String,
        trim: true
    },
    account_link_url:{
        type: String,
        required: true,
        trim: true
    },
    transfer:{
        type: Array
    },
    token:{
        type:Array
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


const CardInstructor = mongoose.model("CardInstructor", cardInstructorSchema)
module.exports = CardInstructor