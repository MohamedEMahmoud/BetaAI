const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    quizItems:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "quizItem",
        }
    ],
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

quizSchema.virtual('quizzes', {
    ref: 'Section',
    localField: '_id',
    foreignField: 'quizzes'
})

quizSchema.virtual('solvedquizzes', {
    ref: 'SolvedQuiz',
    localField: '_id',
    foreignField: 'quiz'
})

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;