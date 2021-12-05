const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    times: {
        type: Number,
        default: 1,
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Sale = mongoose.model("Sale", saleSchema)
module.exports = Sale