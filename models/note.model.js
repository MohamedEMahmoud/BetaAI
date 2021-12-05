const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    section:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
    },
    student:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    time:{
        type: String,
        trim: true,
        required: true
    },
    note:{
        type: String,
        required: true,
        trim: true
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

noteSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'course'
})

noteSchema.virtual('sections', {
    ref: 'Section',
    localField: '_id',
    foreignField: 'section'
})

noteSchema.virtual('lectures', {
    ref: 'Lecture',
    localField: '_id',
    foreignField: 'lecture'
})

noteSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'student'
})

const Note = mongoose.model('Note' , noteSchema)
module.exports = Note