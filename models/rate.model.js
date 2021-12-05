const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    section:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section"
    },
    lecture:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
    },
    student:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    rate:{
        type: Number,
        trim: true,
        max: 5
    },
    type: {
        type: String,
        trim: true,
        enum: ['course', 'lecture']
    },
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })


const Rate = mongoose.model('Rate' , rateSchema)
module.exports = Rate
