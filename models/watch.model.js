const mongoose = require("mongoose");

const watchSchema = new mongoose.Schema({
    course:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    },
    lectures: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
    }],
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }, 
    points: {
        type: Number,
        default: 0
    }
}, {versionKey: false, timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

const Watch = mongoose.model("Watch", watchSchema);

module.exports = Watch;
