const mongoose = require("mongoose");

const quizItemSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true,
    },
    choices: {
        type: Array,
    },
    image: {
        type: String,
        trim: true
    },
    // degree question
    degree: {
        type: Number,
        required: true,
        trim: true
    },
    // instructor answer
    answer: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        trim: true,
        required: true,
        enum: ['code', 'choices']
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

quizItemSchema.virtual('quizzes', {
    ref: 'Quiz',
    localField: '_id',
    foreignField: 'quizeItems'
})

quizItemSchema.virtual('quizanswers', {
    ref: 'quizAnswer',
    localField: '_id',
    foreignField: 'quest'
})

const quizItem = mongoose.model("quizItem", quizItemSchema);

module.exports = quizItem;