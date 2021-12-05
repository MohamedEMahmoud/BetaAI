const mongoose = require("mongoose");

const commentCourseSchema = new mongoose.Schema({
    student:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    comment:{
        type: String,
        trim: true
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

commentCourseSchema.virtual('comments', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'comments'
})

const commentsCourse = mongoose.model('commentsCourse' , commentCourseSchema)
module.exports = commentsCourse
