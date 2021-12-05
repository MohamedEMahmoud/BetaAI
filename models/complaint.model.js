const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    type: {
        type: String,
        required: true,
        trim: true,
        enum: ["instructor", "course", "payment", "account", "technical"]
    },
    details: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        default: "open",
        enum: ["open", "closed", "solved"],
        trim: true
    },
    /** 'assigned_to' field will contain the technical-support-engineer id who opened this problem first to allocate it to him and close it from others to prevent interference between them. **/
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    comment: {
        type: String,
        trim: false
    }
}, {versionKey: false, timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;