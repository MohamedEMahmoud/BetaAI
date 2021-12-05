const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    answer:{
        type: String,
        trim: true,
    },
    image: {
        type: String,
        trim: true
    },
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

answerSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'answers'
})

answerSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'user'
})


const Answer = mongoose.model('Answer' , answerSchema)
module.exports = Answer
