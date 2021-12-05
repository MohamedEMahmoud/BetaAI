const mongoose = require("mongoose");

const quizAnswerSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "quizItem"
    },
    answer: {
        type: String,
        trim: true,
    },
    valid: {
        type:Boolean,
        default: false
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

quizAnswerSchema.virtual('studentAnswers', {
    ref: 'Quiz',
    localField: '_id',
    foreignField: 'studentAnswers'
})




const quizAnswer = mongoose.model("quizAnswer", quizAnswerSchema);

module.exports = quizAnswer;