const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    buyer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    creditCard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card"
    },
    price:{
        type: Number,
        required: true,
        trim:true
    },
    currency:{
        type:String,
        required: true,
        trim:true
    },
    paid:{
        type:Boolean,
        required: true
    },
    status:{
        type:String,
        required:true
    },
    /** Close the course until the buyer renew his plan **/
    stillOpen: {
        type: Boolean,
        default: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan"
    }, 
    end_in:{
        type: Date
    },
    type: {
        type: String,
        required: true,
        trim: true,
        enum: ['course', 'plan']
    },
}, {versionKey: false, timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

paymentSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'course'
})

paymentSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'buyer'
})

paymentSchema.virtual('plans', {
    ref: 'Plan',
    localField: '_id',
    foreignField: 'plan'
})

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;