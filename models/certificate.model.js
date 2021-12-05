const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    certificate: {
        type: String,
        trim: true,
    },
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })


const Certificate = mongoose.model('Certificate', certificateSchema)
module.exports = Certificate
