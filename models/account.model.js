const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    account_number: {
        iv: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        }
    },
    routing_number: {
        type: Number,
        required: true,
        uniq: true,
        trim: true
    },
    bank_name: {
        type: String,
        required: true,
        uniq: true,
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
    type: {
        type: String,
        required: true,
        trim: true
    },
    stripeBankAccountId: {
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
    account_link_url: {
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


const Account = mongoose.model("Account", accountSchema)
module.exports = Account