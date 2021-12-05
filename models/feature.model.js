const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true,
    },
    isVideo: {
        type: Boolean,
        required: true,
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })


featureSchema.virtual('features', {
    ref: 'Feature',
    localField: '_id',
    foreignField: 'features'
})

const Feature = mongoose.model('Feature', featureSchema)
module.exports = Feature