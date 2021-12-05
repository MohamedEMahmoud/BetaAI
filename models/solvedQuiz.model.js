const mongoose = require("mongoose");

const solvedQuizzesSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Quiz",
    },
    score: {
        type: String,
        trim: true,
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const SolvedQuiz = mongoose.model("SolvedQuiz", solvedQuizzesSchema);

module.exports = SolvedQuiz;