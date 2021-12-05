const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    body: {
        type: String,
        required: true,
        trim: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    global: {
        type: Boolean,
        default: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        trim: true,
    },
    media: {
        type: String,
        trim: true,
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;