const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    preview_course: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        max: [5000, 'Course is too expensive'],
        required: true
    },
    old_price: {
        type: Number,
        max: [5000, 'Course is too expensive'],
    },
    rating: {
        type: Number,
        max: 5,
        default: 0
    },
    brief: {
        type: String,
        trim: true,
        required: true,
        maxlength: 2000
    },
    content: [{
        type: String,
        trim: true,
        required: true
    }],
    requirements: [{
        type: String,
        trim: true,
        required: [true, "You should enter course requirement"],
    }],
    points: {
        type: Number,
        required: true,
        default: 0
    },
    sections: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section",
        }
    ],
    owner: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    author: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "commentsCourse"
    }],
    slug: {
        type: String,
        required: true,
        trim: true
    },
    currency: {
        type: String,
        trim: true,
        default: "usd"
    },
    history: {
        type: Array,
    },
    type: {
        type: String,
        required: true,
        trim: true,
        enum: ['lab', 'course']
    },
    review: {
        type: Boolean,
        default: false
    },
    published: {
        type: Boolean,
        default: false
    },
    problems: {
        type: Array
    },
    path: {
        type: String,
        required: [true, 'path course is required'],
        trim: true,
        enum: ['programming', 'programming-for-data-science', 'mathematics', 'machine-learning', 'mathematics-for-dl', 'deep-learning']
    },
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

courseSchema.virtual('carts', {
    ref: 'Cart',
    localField: '_id',
    foreignField: 'courses'
})

courseSchema.virtual('certificates', {
    ref: 'Certificate',
    localField: '_id',
    foreignField: 'course'
})

courseSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'course'
})

courseSchema.virtual('rates', {
    ref: 'Rate',
    localField: '_id',
    foreignField: 'course'
})

courseSchema.virtual('sales', {
    ref: 'Sale',
    localField: '_id',
    foreignField: 'course'
})

courseSchema.virtual('watches', {
    ref: 'Watch',
    localField: '_id',
    foreignField: 'course'
})

courseSchema.virtual('wishlists', {
    ref: 'WishList',
    localField: '_id',
    foreignField: 'course'
})


const Course = mongoose.model("Course", courseSchema);

module.exports = Course;