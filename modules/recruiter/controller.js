const db = require(__dirname + "/../../models"),
    User = db.user,
    Role = db.role,
    Jobs = db.job,
    JobApplication = db.job_application,
    JobCategories = db.job_categories,
    Skills = db.skills;

exports.createJob = async (req, res) => {
    try {
        const recruiterRole = await Role.findOne({ name: "recruiter" });
        const recruiter = await User.findOne({ _id: req.user._id, roles: recruiterRole._id });

        // find categories
        let cats = [];
        if (req.body.categories) {
            for (let cat in req.body.categories) {
                const categories = await JobCategories.findOne({ name: req.body.categories[cat] });

                if (categories) {
                    cats.push(categories._id);
                } else {
                    throw { status: 401, message: `${req.body.categories[cat]} is not a valid category`, success: false };
                }
            }
        } else {
            throw { status: 422, message: "Enter at least one category to specify this job", success: false };
        }

        // find skills
        let skills = [];
        if (req.body.skills) {
            for (let skill in req.body.skills) {
                const item = await Skills.findOne({ name: req.body.skills[skill] });

                if (item) {
                    skills.push(item._id);
                } else {
                    throw { status: 401, message: `${req.body.skills[skill]} is not a valid skill`, success: false };
                }
            }
        } else {
            throw { status: 422, message: "Enter at least one skill to specify this job", success: false };
        }

        req.body.recruiter = recruiter._id;
        req.body.keywords = skills;
        req.body.categories = cats;

        const job = await new Jobs({ ...req.body });

        // get company_image, company_url and company_details from recruiter profile
        if (recruiter.company_name) {
            job.company_name = recruiter.company_name;
        } else {
            throw { status: 422, message: "Company name is required.", success: false };
        }

        if (recruiter.image) {
            job.image = recruiter.image;
        } else {
            throw { status: 422, message: "Company image is required; please add company logo in your profile as profile picture firstly!", success: false };
        }

        if (recruiter.about) {
            job.about = recruiter.about;
        } else {
            throw { status: 422, message: "Company brief is required; please add brief about the company in your profile firstly!", success: false };
        }

        if (recruiter.website) {
            job.company_url = recruiter.website;
        } else {
            throw { status: 422, message: "Company website is required; please add website in your profile firstly!", success: false };
        }

        await job.save();

        const populatedJob = await Jobs.findOne({ _id: job._id })
            .populate([
                {
                    path: 'keywords',
                    model: 'Skills'
                },
                {
                    path: 'categories',
                    model: 'JobCategories'
                },
                {
                    path: 'recruiter',
                    model: 'User',
                    select: '_id name username email sex age image address phone government country level'
                }
            ])

        res.status(200).send({ status: 200, job: populatedJob, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.updateApplicationStatus = async (req, res) => {
    try {

        let query = {};
        if (req.body.viewed === true || req.body.viewed === "true") {
            query.viewed = true;
        }

        if (req.body.canceled === true || req.body.canceled === "true") {
            query.canceled = true;
        }

        if (req.body.in_consideration === true || req.body.in_consideration === "true") {
            query.in_consideration = true;
        }
        const application = await JobApplication.findByIdAndUpdate(req.query.application_id, query, { new: true, useFindAndModify: true });
        res.status(200).send({ status: 200, application, success: true })
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}