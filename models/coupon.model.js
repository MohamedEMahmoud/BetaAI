const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    coupon: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 8,
    },
    times: {
        type: Number,
        required: true,
        default: 1
    },
    discount: {
        type: Number,
        required: true,
        max: [100, 'Maximum discount percentage is 100%'],
        min: [5, 'Minimum discount percentage is 5%']
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    status: {
        type: Boolean,
        default: true
    }
}, {versionKey: false, timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;