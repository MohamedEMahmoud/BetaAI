const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    thumbnail: {
        type: String,
        trim: true
    },
    preview_lecture: {
        type: String,
        trim: true
    },
    lecture_video: {
        type: String,
        trim: true
    },
    media: {
        type: String,
        trim: true
    },
    about: {
        type: String,
        trim: true,
        maxlength: 500
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    rating:{
        type: Number,
        max: 5,
        default:0
    },
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
        }
    ],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "commentsLecture"
    }],
    slug: {
        type: String,
        required: true,
        trim: true
    },
    time:{
        type:String,
        required: [true, 'Lecture time is required'],
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim:true,
        enum : ['video' , 'file']
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

lectureSchema.virtual('lectures', {
    ref: 'Section',
    localField: '_id',
    foreignField: 'lectures'
})

lectureSchema.virtualpath('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'lecture'
})

lectureSchema.virtual('rates', {
    ref: 'Rate',
    localField: '_id',
    foreignField: 'lecture'
})

lectureSchema.virtual('watches', {
    ref: 'Watch',
    localField: '_id',
    foreignField: 'lectures'
})

const Lecture = mongoose.model("Lecture", lectureSchema);

module.exports = Lecture;