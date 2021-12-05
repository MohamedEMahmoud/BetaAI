const db = require(__dirname + "/../../models"),
    User = db.user,
    Role = db.role,
    Category = db.job_categories,
    Skill = db.skills,
    Complaint = db.complaint,
    Course = db.course,
    Domain = db.domain,
    Plan = db.plan,
    Feature = db.feature,
    _ = require('lodash'),
    nodemailer = require("nodemailer"),
    moment = require("moment"),
    { OAuth2Client } = require('google-auth-library'),
    Cloudinary = require("cloudinary").v2,
    fs = require('fs'),
    CronJob = require('cron').CronJob;


const sendMail = async (req, res, complaint, receiver) => {
    const status = complaint.status;
    let msg;

    if (status === "solved") {
        msg = `<p style="font-size: 16px; direction: ltr; margin: 20px auto; text-align: center">We gladly inform you that your complaint code-named <a href=${process.env.CLIENT_URL}/${complaint._id}>Complaint</a> has been successfully resolved.</p>`
    } else {
        msg = `<p style="font-size: 16px; direction: ltr; margin: 20px auto; text-align: center">Your complaint named <a href=${process.env.CLIENT_URL}/${complaint._id}>Complaint</a> has been closed. Check your Control Panel for the reason for closing.</p>`
    }

    const client = await new OAuth2Client(process.env.CLIENT_ID, process.env.CLEINT_SECRET, process.env.REDIRECT_URI);
    client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    const accessToken = await client.getAccessToken();

    let transport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: process.env.MAIL_SERVER_PORT,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USER,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLEINT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken,
        }
    });
    const message = {
        from: '"BetaAI Support" <no-reply@beta.ai>',
        to: receiver.email,
        subject: `BetaAI - Complaint status update`,
        html: `
                    <div style="text-align: center;  font-family: sans-serif; direction: ltr; width: 600px; margin: auto">
                        <img src="https://i.ibb.co/fCrSpsF/logo.jpg" alt="Beta AI" style="width: 250px">

                        <div style="background: #FFFFFF; text-align: left">
                          <div style="display: flex; justify-content: center; align-items: center; flex-direction: column; padding: 20px 10px; direction: ltr">
                            <h4 style="font-size: 18px; direction: ltr; margin: auto">Hi, ${receiver}</h4>
                            ${msg}
                          </div>
                        </div>
                    
                        <div style="color: #FFFFFF; background: #041438;">
                          <div style="display: flex; justify-content: space-around; align-items: center; margin: auto; width: 500px; flex-wrap: wrap; direction: ltr">
                            <a style="color: #FFFFFF; direction: ltr" href="">Support</a>
                            <p style="margin: 0 10px">|</p>
                            <a style="color: #FFFFFF; direction: ltr" href="">Find a Job</a>
                            <p style="margin: 0 10px">|</p>
                            <a style="color: #FFFFFF; direction: ltr" href="">Become an instructor</a>
                            <p style="margin: 0 10px">|</p>
                            <a style="color: #FFFFFF; direction: ltr" href="">Careers at BetaAI</a>
                          </div>
                          <p style="margin: 20px 0; direction: ltr">&copy; 2020 - <a style="color: #FFFFFF; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
                        </div>
                    </div>
                `
    };

    transport.verify((error) => {
        if (error) {
            console.log(error)
        }
        else {
            console.log('server is redy to send email')
        }
    });

    return await transport.sendMail(message, (error, body) => {
        if (error) {
            throw {
                status: 500,
                message: error.message || "email message about change Complaint Status not sent",
                success: false
            };
        }
    });
}

exports.addNewRole = async (req, res) => {
    try {
        const role = await new Role({ ...req.body });
        await role.save();
        res.send({
            status: 200,
            message: "Role added successfully",
            success: true
        })
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.updatePermissions = async (req, res) => {
    try {
        const role = await Role.find({ name: req.body.role });
        const user = await User.findOneAndUpdate({ email: req.body.email }, { $addToSet: { roles: [role[0]._id] } }, { new: true });

        res.send({
            status: 202,
            data: {
                name: user.name,
                username: user.username,
                email: user.email,
                age: user.age,
                role: role[0].name.toUpperCase()
            },
            success: true
        })
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.createCategory = async (req, res) => {
    try {
        const category = await new Category({ ...req.body });
        category.creator = req.user._id
        await category.save();

        res.status(200).send({ status: 200, category, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.getCategories = async (req, res) => {
    const skip = req.query.page ? req.query.page ? req.query.page > 1 : 1 : 1;

    try {
        const categories = await Category.find({}, {}, { limit: 9, skip: 9 * skip });
        res.status(200).send({ status: 200, categories, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.createSkill = async (req, res) => {
    try {
        const skill = await new Skill({ ...req.body });
        skill.creator = req.user._id
        await skill.save();

        res.status(200).send({ status: 200, skill, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.getSkills = async (req, res) => {
    const skip = req.query.page ? req.query.page ? req.query.page > 1 : 1 : 1;

    try {
        const skills = await Skill.find({}, {}, { limit: 9, skip: 9 * skip });
        res.status(200).send({ status: 200, skills, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

// for admins ONLY
exports.showAllComplaints = async (req, res) => {
    const skip = req.query.page ? req.query.page ? req.query.page > 1 : 1 : 1;
    try {
        const complaints = await Complaint.find({}, {}, {
            limit: 10,
            skip: skip * 10
        }).populate("assigned_to", "_id name email image username");
        res.status(200).send({ status: 200, complaints, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.assignComplaintToSpecificAdmin = async (req, res) => {
    try {
        const adminRole = await Role.findOne({ name: "admin" });
        if (!req.user.roles.includes(adminRole._id)) {
            throw { status: 401, message: "unauthorized", success: false };
        }

        await Complaint.findByIdAndUpdate(req.body.complaint, { assigned_to: req.user._id });
        res.status(200).send({ status: 200, message: "assigned successfully", success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.changeComplaintStatus = async (req, res) => {
    try {
        const adminRole = await Role.findOne({ name: "admin" });
        if (!req.user.roles.includes(adminRole._id) && req.query.status.toLowerCase() === "solved") {
            throw { status: 401, message: "unauthorized", success: false };
        }

        const complaint = await Complaint.findByIdAndUpdate(req.body.complaint, { status: req.query.status.toLowerCase(), comment: req.body.comment || "" });

        const receiver = await User.findOne({ _id: complaint._id });
        await sendMail(req, res, complaint, receiver);

        res.status(204).send({ status: 204, message: "updated successfully", success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.showUsersComplaint = async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user._id });
        res.status(200).send({ status: 200, complaints, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.getCoursesNeedsReview = async (req, res) => {
    try {
        const courses = await Course.find({ review: true })
            .populate([
                {
                    path: 'owner',
                    model: 'User',
                    select: '_id name username email sex age image address phone government country level'
                },
                {
                    path: 'author',
                    model: 'User',
                    select: '_id name username email sex age image address phone government country level'
                },
                {
                    path: "sections",
                    model: "Section",
                    populate: [
                        {
                            path: 'lectures',
                            model: 'Lecture',
                            populate: [
                                {
                                    path: 'questions',
                                    model: 'Question',
                                    populate: [
                                        {
                                            path: 'student',
                                            model: 'User',
                                            select: '_id name username email sex age image address phone government country level'
                                        },
                                        {
                                            path: 'answers',
                                            model: 'Answer',
                                            populate: {
                                                path: 'user',
                                                model: 'User',
                                                select: '_id name username email sex age image address phone government country level'
                                            }
                                        }
                                    ]
                                },
                                {
                                    path: 'comments',
                                    model: 'commentsLecture',
                                    populate: {
                                        path: 'student',
                                        model: 'User',
                                        select: '_id name username email sex age image address phone government country level'
                                    }
                                }
                            ]
                        },
                        {
                            path: 'quizzes',
                            model: 'Quiz',
                            populate: {
                                path: 'quizItems',
                                model: 'quizItem'
                            }
                        }
                    ]
                }
            ])

        if (courses.length >= 1) {
            res.status(200).send({ status: 200, courses, success: true })
        }
        res.send({ status: 200, message: "There are no courses reviewd", success: false })

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.publishCourse = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course, review: true })
        if (course) {
            course.published = true;
            course.problems = [];
            await course.save();
            res.status(200).send({ status: 200, message: "done confirm published", success: true })
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.sendCourseBackToInstructor = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course, review: true });

        if (course) {
            course.problems = [...req.body.problems];
            course.review = false;
            await course.save();
            res.status(200).send({ status: 200, course, success: true });
        } else {
            res.status(404).send({ status: 404, message: "Course not found", success: false });
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.addDomain = async (req, res) => {
    try {
        const domainExist = await Domain.findOne({ domain: req.body.domain });

        if (domainExist) {
            throw { status: 400, message: "domain exists", success: false };
        }

        if (typeof req.body.time === 'number') {
            throw { status: 400, message: "type d for day Or m for month Or y for year with this number", success: false }
        }
        let num, str;
        if (req.body.time) {
            num = parseInt(req.body.time.match(/\d+/)[0]);
            str = req.body.time.replace(num, '');
            str === 'd' ? str = 'days' : str === 'm' ? str = 'months' : str = 'years'
        }

        const domain = await new Domain({
            domain: req.body.domain,
            discount: req.body.discount,
            about: req.body.about,
            time: req.body.time,
            end_in: req.body.time ? moment().add(num, str).format() : undefined
        })

        await domain.save();

        if (domain.end_in) {
            // to test put new Date(req.body.end_in) instead domain.end_in and don't send time but must send end_in in postman body formdata and become format 2021-03-27T12:51:38.000+00:00
            const job = await new CronJob(domain.end_in, async () => {
                //runs once at the specified date.
                domain.active = false
                await domain.save()
            })
            job.start()
        }

        res.status(200).send({ status: 200, domain, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.updateDomain = async (req, res) => {
    try {
        const domain = await Domain.findOne({ domain: req.query.domain });

        if (!domain) {
            throw { status: 400, message: "domain not exists", success: false }
        }

        req.domain = domain;
        req.domain = _.extend(req.domain, { ...req.body });
        req.domain.updatedAt = Date.now();
        await req.domain.save();
        res.status(200).send({ status: 200, domain: req.domain, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.removeDomain = async (req, res) => {
    try {
        const domain = await Domain.findOne({ domain: req.query.domain });

        if (!domain) {
            throw { status: 400, message: "domain not exists", success: false }
        }

        await domain.remove();
        res.status(204).send({ status: 204, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.getAllDomain = async (req, res) => {
    try {
        const domains = await Domain.find()
        if (domains) {
            res.status(200).send({ status: 200, domains, success: true })
        }
        else {
            res.status(204).send({ status: 204, message: "no domains to show ", success: false })
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.addPlan = async (req, res) => {
    try {
        const planExist = await Plan.findOne({ name: req.body.name })

        if (planExist) {
            throw { status: 400, message: "plan exists", success: false };
        }

        const plan = await new Plan({ ...req.body });
        if (req.body.feature) {

            if (typeof req.body.feature === "object") {
                for (let i = 0; i < req.body.feature.length; i++) {
                    const feature = await Feature.findOne({ name: { "$regex": req.body.feature[i], "$options": "i" } });
                    if (!feature) {
                        throw { status: 404, message: `${feature.name} does not exist`, success: false };
                    }
                    if (plan.features.includes(feature._id)) {
                        throw { status: 404, message: `${feature.name} exists`, success: false };
                    }
                    plan.features = [...plan.features, feature._id];
                }
            } else {
                const feature = await Feature.findOne({ name: { "$regex": req.body.feature, "$options": "i" } });
                if (plan.features.includes(feature._id)) {
                    throw { status: 404, message: `${feature.name} exists`, success: false };
                }
                plan.features = [...plan.features, feature._id];
            }
        }

        if (typeof req.body.time === 'number') {
            throw { status: 400, message: "type d for day Or m for month Or y for year with this number", success: false }
        }
        await plan.save();

        const population = await Plan.findOne({ _id: plan._id }).populate("features");
        res.status(200).send({ status: 200, plan: population, success: true })
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.updatePlan = async (req, res) => {
    try {
        const plan = await Plan.findOne({ name: req.query.plan });

        if (!plan) {
            throw { status: 400, message: "plan not exists", success: false }
        }

        req.plan = plan;
        req.plan = _.extend(req.plan, { ...req.body });
        req.plan.updatedAt = Date.now();

        if (req.body.feature) {
            if (typeof req.body.feature === "object") {

                for (let i = 0; i < req.body.feature.length; i++) {
                    const feature = await Feature.findOne({ name: { "$regex": req.body.feature[i], "$options": "i" } });

                    if (!feature) {
                        throw { status: 404, message: `${feature.name} does not exist`, success: false };
                    }

                    if (req.plan.features.includes(feature._id)) {
                        continue;
                    }

                    req.plan.features = [...req.plan.features, feature._id];
                }

            } else {
                const feature = await Feature.findOne({ name: { "$regex": req.body.feature, "$options": "i" } });

                if (req.plan.features.includes(feature._id)) {
                    throw { status: 404, message: `${feature.name} exists`, success: false };
                }

                req.plan.features = [...req.plan.features, feature._id];
            }
        }

        await req.plan.save();

        const population = await Plan.findOne({ _id: req.plan._id }).populate("features");
        res.status(200).send({ status: 200, plan: population, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.removePlan = async (req, res) => {
    try {
        const plan = await Plan.findOne({ name: req.query.plan });

        if (!plan) {
            throw { status: 400, message: "plan not exists", success: false }
        }

        const usedPLan = await User.find({ plan: plan._id });

        if (usedPLan) {
            throw { status: 400, message: "This plan cannot be deleted because it is already in use", success: false }
        } else {
            await plan.remove();
            res.status(200).send({ status: 200, plan: {}, success: true });
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.getAllPlan = async (req, res) => {
    try {
        const plans = await Plan.find().populate('features');
        if (plans) {
            res.status(200).send({ status: 200, plans, success: true })
        }
        else {
            res.status(204).send({ status: 204, message: "no plans to show ", success: false })
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.createFeature = async (req, res) => {
    try {
        if (!req.body.name) {
            throw { status: 409, message: "feature name is required", success: false }
        }

        const featureExists = await Feature.findOne({ name: req.body.name })

        if (featureExists) {
            throw { status: 400, message: "feature exists", success: false };
        }

        const feature = await new Feature({ ...req.body });
        let endPoint = await feature.name.replace(/\s+/g, '-').toLowerCase();

        if (req.files.description) {
            feature.description = await description(req, feature);
            feature.isVideo = true
        } else {
            feature.description = `/about/plans/${endPoint}`
            feature.isVideo = false
        }
        await feature.save();
        res.status(200).send({ status: 200, feature, success: true });

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}
exports.updateFeature = async (req, res) => {
    try {
        const feature = await Feature.findOne({ name: req.query.feature });
        const features = await Feature.find()
        if (!feature) {
            throw { status: 400, message: "feature not exists", success: false }
        }
        let dataLoop;
        features.map(feature => {
            if (req.body.name === feature.name) {
                dataLoop = true;
                return;
            }
        })
        if (dataLoop) {
            throw { status: 400, message: `${req.body.name} exists`, success: false }
        }
        let endPoint = req.body.name ? await req.body.name.replace(/\s+/g, '-').toLowerCase() : null

        req.feature = feature;
        req.feature = _.extend(req.feature, { ...req.body });
        req.feature.updatedAt = Date.now();

        if (!req.files.description) {
            if (req.body.isVideo) {
                req.feature.description = feature.description
            }
            else {
                req.feature.description = `/about/plans/${endPoint}`
                req.feature.isVideo = false
            }
        }
        else {
            req.feature.description = await description(req, feature)
            req.feature.isVideo = true
        }

        await req.feature.save();
        res.status(200).send({ status: 200, feature: req.feature, success: true });
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.removeFeature = async (req, res) => {
    try {
        const feature = await Feature.findOne({ name: req.query.feature });
        const plans = await Plan.find();

        if (!feature) {
            throw { status: 400, message: "feature not exists", success: false }
        }
        let dataLoop;
        plans.map(plan => {
            if (plan.features.includes(feature._id)) {
                dataLoop = true;
                return;
            }
        })
        if (dataLoop) {
            throw { status: 400, message: "feature used", success: false }
        }
        else {
            await feature.remove();
            res.status(200).send({ status: 200, feature: {}, success: true });
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.ban = async (req, res) => {
    try {

        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            throw { status: 400, message: "User dosen't exist", success: false }
        }
        let num, str;
        if (req.body.peroid) {
            num = parseInt(req.body.peroid.match(/\d+/)[0]);
            str = req.body.peroid.replace(num, '');
            str === 'd' ? str = 'days' : str === 'm' ? str = 'months' : str = 'years';
        }

        user.hasAccess = false
        // undefined it is mean ban forever
        const ban = {
            peroid: req.body.peroid ? req.body.peroid : undefined,
            reason: req.body.reason,
            end_in: req.body.peroid ? moment().add(num, str).format() : undefined
        }

        user.ban = [...user.ban, ban];

        await user.save();

        res.status(200).send({ status: 200, user, success: true });

    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.readFile = async (req, res) => {
    try {
        const route = req.query ? req.originalUrl.split("?")[0].replace('/admin/log/', '') : req.originalUrl.replace("/admin/log/", '');

        if ((req.query.success && req.query.faild) || (req.query.search && req.query.success && req.query.faild)) {
            throw { status: 400, message: 'please checkbox on one not both', success: false }
        }

        fs.readFile(__dirname + pathFile(route), 'utf8', (err, data) => {
            if (err) throw { status: 400, message: err.message, success: false };

            let dataArray = data.split('\n').filter(text => text.length !== 0);
            let search = [];

            if (req.query.search && !req.query.success && !req.query.faild) {
                for (let index = 0; index < dataArray.length; index++) {
                    if (dataArray[index].includes(`${req.query.search}`)) {
                        search = [...search, JSON.parse(dataArray[index].slice(dataArray[index].indexOf('data:') + 5))];
                    }
                }
                res.send({ logger: search })
            }

            else if (req.query.search && req.query.success) {
                for (let index = 0; index < dataArray.length; index++) {
                    if (dataArray[index].includes(`${req.query.search}`) && dataArray[index].includes('"success":true')) {
                        search = [...search, JSON.parse(dataArray[index].slice(dataArray[index].indexOf('data:') + 5))];
                    }
                }
                res.send({ logger: search })
            }

            else if (req.query.search && req.query.faild) {
                for (let index = 0; index < dataArray.length; index++) {
                    if (dataArray[index].includes(`${req.query.search}`) && dataArray[index].includes('"success":false')) {
                        search = [...search, JSON.parse(dataArray[index].slice(dataArray[index].indexOf('data:') + 5))];
                    }
                }
                res.send({ logger: search })
            }

            else if (req.query.success) {
                let successResponse = [];
                for (let index = 0; index < dataArray.length; index++) {
                    if (dataArray[index].includes('"success":true')) {
                        successResponse = [...successResponse, JSON.parse(dataArray[index].slice(dataArray[index].indexOf('data:') + 5))];
                    }
                }
                res.send({ logger: successResponse })
            }

            else if (req.query.faild) {
                let faildResponse = [];
                for (let index = 0; index < dataArray.length; index++) {
                    if (dataArray[index].includes('"success":false')) {
                        faildResponse = [...faildResponse, JSON.parse(dataArray[index].slice(dataArray[index].indexOf('data:') + 5))];
                    }
                }
                res.send({ logger: faildResponse })
            }

            else {
                let response = []
                for (let index = 0; index < dataArray.length; index++) {
                    response = [...response, JSON.parse(dataArray[index].slice(dataArray[index].indexOf('data:') + 5))];
                }
                res.send({ logger: response })
            }
        })
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.deleteSelectLine = async (req, res) => {
    try {
        const route = req.originalUrl.split("?")[0].replace('/admin/log/', '');
        fs.readFile(__dirname + pathFile(route), 'utf8', function (err, data) {
            if (err) throw { status: 400, message: err.message, success: false };

            let dataArray = data.split('\n').filter(text => text.length !== 0);
            if (typeof req.query.method === 'string') {
                for (let index = 0; index < dataArray.length; index++) {
                    if (dataArray[index].includes(req.query.method) && dataArray[index].includes(req.query.path) && dataArray[index].includes(new Date(req.query.createdAt).toISOString()) && dataArray[index].includes(new Date(req.query.updatedAt).toISOString())) {
                        dataArray.splice(index, 1)
                        break;
                    }
                }
            }
            else {
                for (let index = 0; index < req.query.method.length; index++) {
                    if (data.includes(req.query.method[index]) && data.includes(req.query.path[index]) && data.includes(new Date(req.query.createdAt[index]).toISOString()) && data.includes(new Date(req.query.updatedAt[index]).toISOString())) {
                        console.log(dataArray.splice(index, 1))
                    }
                }
            }
            const updatedData = dataArray.join('\n');
            fs.writeFile(__dirname + pathFile(route), updatedData, (err, data) => {
                if (err) throw { status: 400, message: err.message, success: false };
            });
            let response = []
            for (let index = 0; index < dataArray.length; index++) {
                response = [...response, JSON.parse(dataArray[index].slice(dataArray[index].indexOf('data:') + 5))];
            }
            res.send({ logger: response })
        })
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

const description = async (req, feature) => {
    // get description path
    const path = req.files.description[0].path;

    // upload description 
    const plan_description = await Cloudinary.uploader.upload(path,
        {
            public_id: `plans/${req.body.name ? req.body.name : feature.name}/beta-ai-${req.files.description[0].filename}-feature-description`,
            resource_type: "video",
            use_filename: true,
            tags: `plans, ${req.body.name ? req.body.name : feature.name}, description , ${req.files.description[0].filename}`,
            // width: 500,
            // height: 500,
            // crop: "scale",
            placeholder: true,
        }
    );

    // remove file from server after save in storage
    if (plan_description) {
        fs.unlinkSync(path);
    }

    return plan_description.secure_url;
}

const pathFile = (route) => {
    const obj = {
        'admin': '/../admin/admin.log',
        'auth': '/../auth/auth.log',
        'cart': '/../cart/cart.log',
        'checkout': '/../checkout/checkout.log',
        'coupon': '/../coupon/coupon.log',
        'course': '/../course/course.log',
        'instructor': '/../instructor/instructor.log',
        'notification': '/../notification/notification.log',
        'recruiter': '/../recruiter/recruiter.log',
        'super': '/../super/super.log',
        'user': '/../user/user.log',
        'wishlist': '/../wishlist/wishlist.log',
    }

    for (const property in obj) {
        if (route === property) {
            return obj[property];
        }
    }
}