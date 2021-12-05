const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    answers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Answer"
    }],
    image: {
        type: String,
        trim: true
    },
    solved: {
        type: String,
        trim: true,
        default: "open"
    },
    slug:{
        type:String,
        required: true,
        trim: true
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })


questionSchema.virtual('lectures', {
    ref: 'Lecture',
    localField: '_id',
    foreignField: 'questions'
})

const Question = mongoose.model('Question', questionSchema)
module.exports = Question