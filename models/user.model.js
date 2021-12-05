const CardUser = require('./card.user.model'),
    Payment = require('./payment.model'),
    mongoose = require("mongoose"),
    jwt = require('jsonwebtoken'),
    bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: [8, 'Username must be more than 8 characters'],
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be more than 8 characters']
    },
    sex: {
        type: String,
        trim: true,
        lowercase: true,
        enum: ["male", "female"]
    },
    age: {
        type: Number,
    },
    image: {
        type: String,
        trim: true
    },
    roles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role"
        }
    ],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan"
    },
    stillOpen: {
        type: Boolean,
    },
    /** recruiters ONLY **/
    company_name: {
        type: String,
    },
    about: {
        type: String,
        maxlength: 500
    },
    website: {
        type: String
    },
    active: {
        type: Boolean,
        default: false
    },
    activationCode: {
        type: Buffer
    },
    verificationCode: {
        type: String,
    },
    hasAccess: {
        type: Boolean,
        default: true
    },
    ban: [{
        peroid: {
            type: String,
            trim: true
        },
        reason: {
            type: String,
            required: true,
            trim: true
        },
        end_in: {
            type: Date,
        }
    }],
    address: {
        type: Array
    },
    phone: {
        type: String,
        required: [true, "phone number is required"],
        trim: true
    },
    government: {
        type: String,
        trim: true,
    },
    country: {
        type: String,
        trim: true,
    },
    level: {
        type: String,
    },
    secretCode: {
        iv: {
            type: String,
            unique: true
        },
        content: {
            type: String,
            unique: true
        }
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    chats: [{
        friend: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat'
        }
    }],
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET, {
        expiresIn: 2592000 // 1 month
    });

    user.tokens = user.tokens.concat({ token })
    
    return token
}
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified("password")) {
        user.password = await bcrypt.hashSync(user.password, 10)
    }
    next()
})
userSchema.methods.toJSON = function () {
    const user = this;

    const userToObject = user.toObject();

    return {
        ...userToObject,
        password: undefined,
        roles: undefined,
        secretCode: undefined,
        ban: undefined
    }
}

// relation between user as INSTRUCTOR and courses
userSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'author'
})

userSchema.virtual('accounts', {
    ref: 'Account',
    localField: '_id',
    foreignField: 'instructor'
})

userSchema.virtual('answers', {
    ref: 'Answer',
    localField: '_id',
    foreignField: 'user'
})

userSchema.virtual('cardinstructors', {
    ref: 'CardInstructor',
    localField: '_id',
    foreignField: 'instructor'
})

userSchema.virtual('cardusers', {
    ref: 'CardUser',
    localField: '_id',
    foreignField: 'buyer'
})

userSchema.virtual('carts', {
    ref: 'Cart',
    localField: '_id',
    foreignField: 'buyer'
})

userSchema.virtual('certificates', {
    ref: 'Certificate',
    localField: '_id',
    foreignField: 'student'
})

userSchema.virtual('commentscourses', {
    ref: 'commentsCourse',
    localField: '_id',
    foreignField: 'student'
})

userSchema.virtual('commentslectures', {
    ref: 'commentsLecture',
    localField: '_id',
    foreignField: 'student'
})

userSchema.virtual('complaints', {
    ref: 'Complaint',
    localField: '_id',
    foreignField: 'user'
})

userSchema.virtual('complaints', {
    ref: 'Complaint',
    localField: '_id',
    foreignField: 'assigned_to'
})

userSchema.virtual('coupons', {
    ref: 'Coupon',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.virtual('coupons', {
    ref: 'Coupon',
    localField: '_id',
    foreignField: 'user'
})

userSchema.virtual('jobapplications', {
    ref: 'JobApplication',
    localField: '_id',
    foreignField: 'user'
})

userSchema.virtual('jobcategories', {
    ref: 'JobCategorie',
    localField: '_id',
    foreignField: 'creator'
})

userSchema.virtual('skill', {
    ref: 'Skill',
    localField: '_id',
    foreignField: 'creator'
})

userSchema.virtual('jobs', {
    ref: 'Job',
    localField: '_id',
    foreignField: 'recruiter'
})

userSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'student'
})

userSchema.virtual('quizanswers', {
    ref: 'quizAnswer',
    localField: '_id',
    foreignField: 'student'
})

userSchema.virtual('rates', {
    ref: 'Rate',
    localField: '_id',
    foreignField: 'student'
})

userSchema.virtual('sales', {
    ref: 'Sale',
    localField: '_id',
    foreignField: 'instructor'
})

userSchema.virtual('solvedquizzes', {
    ref: 'SolvedQuiz',
    localField: '_id',
    foreignField: 'student'
})

userSchema.virtual('watches', {
    ref: 'Watch',
    localField: '_id',
    foreignField: 'student'
})

userSchema.virtual('wishlists', {
    ref: 'WishList',
    localField: '_id',
    foreignField: 'buyer'
})

userSchema.virtualpath('chats', {
    ref: 'Chat',
    localField: '_id',
    foreignField: 'sender'
})

userSchema.virtualpath('chats', {
    ref: 'Chat',
    localField: '_id',
    foreignField: 'receiver'
})

userSchema.virtual('messages', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'sender'
})

// Delete user cards when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await CardUser.deleteMany({ buyer: user._id })
    next()
})

// Delete user payments when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Payment.deleteMany({ buyer: user._id })
    next()
})

const User = mongoose.model("User", userSchema);

module.exports = User;