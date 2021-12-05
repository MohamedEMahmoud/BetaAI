const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    }],
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    } , 
    total: {
        type: Number,
        required: true,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
}, {versionKey: false, timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;