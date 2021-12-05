const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "applicant is required."]
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: [true, "job is required."]
    },
    answers: [{
        type: String,
        trim: true
    }],
    cv: {
        type: String,
        trim: true
    },
    cover_letter: {
        type: String,
        trim: true,
        minlength: [100, "Cover letter must exceed 100 characters."]
    },
    viewed: {
        type: Boolean,
        default: false
    },
    canceled: {
        type: Boolean,
        default: false
    },
    in_consideration: {
        type: Boolean,
        default: false
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


jobApplicationSchema.virtual('jobs',{
    ref: 'Job',
    localField:'_id',
    foreignField: 'applications'
})

jobApplicationSchema.virtual('jobs',{
    ref: 'Job',
    localField:'_id',
    foreignField: 'viewed_applications'
})



const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

module.exports = JobApplication;