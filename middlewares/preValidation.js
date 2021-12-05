createInstructorAccount = async (req, res, next) => {
    try {
        if (req.body.account_number || req.body.routing_number) {
            const fieldRequired = ['account_number', 'routing_number', 'country', 'currency'];
            const fieldName = [...Object.keys(req.body)]
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Bank ${fieldRequired[i].replace('_', ' ')} is required`, success: false }
                }
            }
        }
        else if (req.body.number || req.body.exp_month || req.body.exp_year) {
            const fieldRequired = ['number', 'exp_month', 'exp_year', 'country', 'currency'];
            const fieldName = [...Object.keys(req.body)]
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Debit Card ${fieldRequired[i].replace('_', ' ')} is required`, success: false }
                }
            }
        }
        else {
            throw { status: 400, message: 'All field is required', success: false }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createCreditCard = async (req, res, next) => {
    try {
        const fieldRequired = ['number', 'cvc', 'exp_month', 'exp_year'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Credit Card ${fieldRequired[i].replace('_', ' ')} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createCoupon = async (req, res, next) => {
    try {
        const fieldRequired = ['times', 'discount'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Coupon ${fieldRequired[i]} is required`, success: false }
            }
            if (req.body.discount) {
                if (req.body.discount > 100) {
                    throw { status: 400, message: 'Maximum discount percentage is 100%', success: false }
                }
                if (req.body.discount < 5) {
                    throw { status: 400, message: 'Minimum discount percentage is 5%', success: false }
                }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createDomain = async (req, res, next) => {
    try {
        const fieldRequired = ['domain', 'discount', 'about'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Domain ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createPlan = async (req, res, next) => {
    try {
        const fieldRequired = ['name', 'price', 'about', 'currency', 'time'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Plan ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createFeature = async (req, res, next) => {
    try {
        const fieldRequired = ['name'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Feature ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createCourse = async (req, res, next) => {
    try {
        const fieldRequired = [
            'title',
            'level',
            'price',
            'brief',
            'points',
            'currency',
            'type',
            'path',
            'content',
            'requirements',
            'image',
            'preview_course',
        ];
        const fieldName = [...Object.keys(req.body), ...Object.keys(req.files)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Course ${fieldRequired[i].replace('_', ' ')} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

courseMessage = async (req, res, next) => {
    try {
        if (req.body.price > 5000 || req.body.old_price > 5000) {
            throw { status: 400, message: 'Course is too expensive', success: false }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createSection = async (req, res, next) => {
    try {
        const fieldRequired = ['title'];
        const fieldName = [...Object.keys(req.body)];
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Section ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createLecture = async (req, res, next) => {
    try {
        let fieldRequired = ['name', 'points', 'type','time'];
        const fieldName = [...Object.keys(req.body)];
        if (req.body.type === 'file') {
            fieldRequired = fieldRequired.filter(required => required !== 'points');
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Lecture ${fieldRequired[i]} is required`, success: false }
                }
            }
        }
        else {
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Lecture ${fieldRequired[i]} is required`, success: false }
                }
            }
        }
        next();
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createLectureNote = async (req, res, next) => {
    try {
        const fieldRequired = ['note', 'time'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Lecture ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createQuestion = async (req, res, next) => {
    try {
        const fieldRequired = ['question'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Field ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createAnswer = async (req, res, next) => {
    try {
        const fieldRequired = ['answer'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Field ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createQuize = async (req, res, next) => {
    try {
        const fieldRequired = ['name'];
        const fieldName = [...Object.keys(req.body)];
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Quize ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createQuizeItem = async (req, res, next) => {
    try {
        if (req.body.type === 'code') {
            const fieldRequired = ['question', 'degree', 'answer'];
            const fieldName = [...Object.keys(req.body)]
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Item ${fieldRequired[i]} is required`, success: false }
                }
            }
        }
        else {
            const fieldRequired = ['type', 'question', 'a', 'b', 'c', 'd', 'degree', 'answer'];
            const fieldName = [...Object.keys(req.body)]
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Item ${fieldRequired[i]} is required`, success: false }
                }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

signUp = async (req, res, next) => {
    try {
        const fieldRequired = ['name', 'username', 'email', 'password', 'day', 'month', 'year', 'sex', 'phone', 'government', 'country'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                if ((fieldRequired[i] === 'username' && req.body.username.length < 8) || (fieldRequired[i] === 'password' && req.body.password.length < 8)) {
                    throw { status: 400, message: `Field ${fieldRequired[i]} must be more than 8 characters`, success: false }
                }
                throw { status: 400, message: `Field ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

ban = async (req, res, next) => {
    try {
        const fieldRequired = ['reason'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `ban ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createJobApplication = async (req, res, next) => {
    try {
        const fieldRequired = ['job', 'cover_letter'];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Application ${fieldRequired[i].replace('_', ' ')} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

jobApplicationMessage = async (req, res, next) => {
    try {
        if (req.body.cover_letter.length < 100) {
            throw { status: 400, message: 'Cover letter must exceed 100 characters', success: false }
        }

        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

create_Job_Category_Skills = async (req, res, next) => {
    try {
        let fieldRequired = ['name', 'specialization'];
        const fieldName = [...Object.keys(req.body)];
        if (req.body.categories) {
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Category ${fieldRequired[i]} is required`, success: false }
                }
            }
        }
        if (req.body.skills) {
            fieldRequired = fieldRequired.filter(required => required !== 'specialization');
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Skill ${fieldRequired[i]} is required`, success: false }
                }
            }
        }
        else {
            let fieldRequired = ['name', 'specialization', 'vacancies', 'type', 'level', 'experience', 'about', 'requirements', 'company_name', 'company_url', 'location'];
            const fieldName = [...Object.keys(req.body)];
            for (let i = 0; i < fieldRequired.length; i++) {
                if (!fieldName.includes(fieldRequired[i])) {
                    throw { status: 400, message: `Job ${fieldRequired[i]} is required`, success: false }
                }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

Job_Category_Skills_Message = async (req, res, next) => {
    try {
        if (req.body.categories && req.body.name.length < 12) {
            throw { status: 400, message: 'Category name must exceed 12 characters', success: false }
        }

        else if (req.body.skills && req.body.name.length < 8) {
            throw { status: 400, message: 'Skill name must exceed 8 characters', success: false }
        }
        else {
            if (req.body.name < 16) {
                throw { status: 400, message: 'Job name must exceed 16 characters', success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

createNotification = async (req, res, next) => {
    try {
        const fieldRequired = ['title', 'body',];
        const fieldName = [...Object.keys(req.body)]
        for (let i = 0; i < fieldRequired.length; i++) {
            if (!fieldName.includes(fieldRequired[i])) {
                throw { status: 400, message: `Notification ${fieldRequired[i]} is required`, success: false }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}


module.exports = {
    createInstructorAccount,
    createCreditCard,
    createCoupon,
    createDomain,
    createPlan,
    createFeature,
    createCourse,
    courseMessage,
    createSection,
    createLecture,
    createLectureNote,
    createQuize,
    createQuizeItem,
    createJobApplication,
    jobApplicationMessage,
    create_Job_Category_Skills,
    Job_Category_Skills_Message,
    createQuestion,
    createAnswer,
    createNotification,
    signUp,
    ban
}