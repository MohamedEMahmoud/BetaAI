const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    about: {
        type: String,
        maxlength: 500
    },
    lectures: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lecture",
        }
    ],
    quizzes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
        }
    ],
    slug: {
        type: String,
        required: true,
        trim: true
    }
}, {versionKey: false, timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

sectionSchema.virtual('sections', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'sections'
})

sectionSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'section'
})

sectionSchema.virtual('rates', {
    ref: 'Rate',
    localField: '_id',
    foreignField: 'section'
})


const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;