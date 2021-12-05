const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "role name is required"],
        trim: true,
        lowercase: true
    },
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

roleSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'roles'
})
const Role = mongoose.model("Role", roleSchema)

module.exports = Role;
