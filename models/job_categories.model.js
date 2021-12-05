const mongoose = require("mongoose");

const jobCategorieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        minlength: [12, "Category name must exceed 12 characters."]
    },
    specialization: {
        type: String,
        required: [true, "Category specialization is required"],
        trim: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

jobCategorieSchema.virtual('jobs',{
    ref: 'Job',
    localField:'_id',
    foreignField: 'categories'
})


const JobCategorie = mongoose.model("JobCategorie", jobCategorieSchema);

module.exports = JobCategorie;