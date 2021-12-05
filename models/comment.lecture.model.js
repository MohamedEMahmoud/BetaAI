const mongoose = require("mongoose");

const commentLectureSchema = new mongoose.Schema({
    student:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    comment:{
        type: String,
        trim: true
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

commentLectureSchema.virtual('comments', {
    ref: 'Lectuer',
    localField: '_id',
    foreignField: 'comments'
})

const commentsLecture = mongoose.model('commentsLecture' , commentLectureSchema)
module.exports = commentsLecture
