const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    sender: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    receiver: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: String,
        trim: true,
    },
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

chatSchema.virtual('messages', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'chat'
})

const Chat = mongoose.model('Chat', chatSchema)
module.exports = Chat
