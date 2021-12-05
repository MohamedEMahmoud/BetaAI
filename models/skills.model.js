const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Skill name is required."],
        unique: true,
        trim: true,
        minlength: [8, "Skill name must exceed 8 characters."]
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

skillSchema.virtual('jobs',{
    ref: 'Job',
    localField:'_id',
    foreignField: 'keywords'
})

const Skill = mongoose.model("Skill", skillSchema);

module.exports = Skill;