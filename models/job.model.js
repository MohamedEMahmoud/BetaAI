const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Job name is required"],
        trim: true,
        minlength: [16, "Job name must exceed 16 characters."]
    },
    specialization: {
        type: String,
        required: [true, "Job specialization is required"],
        trim: true,
    },
    vacancies: {
        type: Number,
        required: [true, "Open vacancies number is required"],
        min: 1
    },
    salary: Number,
    type: {
        type: String,
        required: [true, "Job type is required"],
        trim: true,
        enum: ["full_time", "part_time", "intern"]
    },
    level: {
        type: String,
        required: [true, "Job level is required"],
        trim: true,
        enum: ["student", "entry_level", "junior", "senior"]
    },
    experience: {
        type: Number,
        required: [true, "Job experience is required"]
    },
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "JobCategories"
    }],
    about: [{
        type: String,
        required: [true, "Your must write brief about this job"]
    }],
    requirements: [{
        type: String,
        required: [true, "You must enter job requirements"]
    }],
    keywords: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skills"
    }],
    apply_questions: [{
        type: String,
        trim: true
    }],
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    company_name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    company_url: {
        type: String,
        trim: true,
        required: [true, "Company url is required"]
    },
    location: {
        type: String,
        required: [true, "Job location is required"],
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobApplication"
    }],
    viewed_applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobApplication"
    }],
    status: {
        type: Boolean,
        default: true
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

jobSchema.virtual('jobapplications',{
    ref: 'JobApplication',
    localField:'_id',
    foreignField: 'job'
})


const Job = mongoose.model("Job", jobSchema);

module.exports = Job;