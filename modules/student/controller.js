const db = require(__dirname + "/../../models"),
    Course = db.course,
    Section = db.section,
    Lecture = db.lecture,
    Jobs = db.job,
    JobApplication = db.job_application,
    CardUser = db.cardUser,
    Payment = db.payment,
    Complaint = db.complaint,
    commentCourse = db.commentsCourse,
    Rate = db.rate,
    Note = db.note,
    Notification = db.notification,
    Question = db.question,
    Answer = db.answer,
    quizItem = db.quizItem,
    quizAnswer = db.quizAnswer,
    bestSeller = db.bestseller,
    activeWindow = require('active-win'),
    { OAuth2Client } = require('google-auth-library'),
    crypto = require('crypto'),
    slugify = require('slugify'),
    _ = require('lodash'),
    Cloudinary = require("cloudinary").v2,
    fs = require('fs');

exports.singleCourse = async (req, res) => {
    try {
        const courseSlug = req.query.slug
        const course = await Course.findOne({ slug: courseSlug })
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
                    path: 'sections',
                    model: 'Section',
                    populate: {
                        path: 'lectures',
                        model: 'Lecture'
                    },
                }
            ])

        res.status(200).send({ status: 200, course, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.courses = async (req, res) => {
    const resultsPerPage = 9;
    const page = req.query.page ? req.query.page >= 1 ? req.query.page : 1 : 0;

    try {
        const courses = await Course.find({ type: 'course' }, {}, { limit: resultsPerPage, skip: page * resultsPerPage })
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
                    path: 'sections',
                    model: 'Section',
                    populate: {
                        path: 'lectures',
                        model: 'Lecture'
                    },
                }
            ]);

        let bestSellerCourses = [];
        let usualSellerCourses = [];
        const coursesExistInBestSeller = await bestSeller.find({ product: courses.map(course => course.slug) })
        courses.forEach((course, idx) => {
            if (course.slug.includes(coursesExistInBestSeller.map(courseExistInBestSeller => courseExistInBestSeller.product)[idx]) && coursesExistInBestSeller.map(courseExistInBestSeller => courseExistInBestSeller.times)[idx] > process.env.BEST_SELLER_COURSES) {
                bestSellerCourses = [...bestSellerCourses, course]
            }
            else {
                usualSellerCourses = [...usualSellerCourses, course]
            }
        })
        res.status(200).send({ status: 200, bestSellerCourses, usualSellerCourses, success: true });
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.labs = async (req, res) => {
    try {
        const courses = await Course.find({ type: 'lab' })
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
                    path: 'sections',
                    model: 'Section',
                    populate: {
                        path: 'lectures',
                        model: 'Lecture'
                    },
                }
            ])
        let bestSellerCourses = [];
        let usualSellerCourses = [];
        const coursesExistInBestSeller = await bestSeller.find({ product: courses.map(course => course.slug) })
        courses.forEach((course, idx) => {
            if (course.slug.includes(coursesExistInBestSeller.map(courseExistInBestSeller => courseExistInBestSeller.product)[idx]) && coursesExistInBestSeller.map(courseExistInBestSeller => courseExistInBestSeller.times)[idx] > process.env.BEST_SELLER_COURSES) {
                bestSellerCourses = [...bestSellerCourses, course]
            }
            else {
                usualSellerCourses = [...usualSellerCourses, course]
            }
        })

        res.status(200).send({ status: 200, bestSellerCourses, usualSellerCourses, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.getUserCard = async (req, res) => {
    try {
        const card = await CardUser.findOne({ buyer: req.user._id })
            .populate({ path: "buyer" })

        const decrypt = (hash) => {
            const CRYPTO_KEY = process.env.CRYPTO_KEY;
            const decipher = crypto.createDecipheriv('aes-256-ctr', CRYPTO_KEY, Buffer.from(hash.iv, 'hex'));
            const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            return decrpyted.toString();
        };

        if (card) {
            let data = {
                ...card._doc,
                number: decrypt(card.number),
                cvc: decrypt(card.cvc)
            }

            res.send({ status: 200, card: data, success: true })
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.applyJob = async (req, res) => {
    try {
        const application = await new JobApplication({ ...req.body });
        application.user = req.user._id;

        if (typeof req.files === "object") {
            // get cv path
            const path = req.files.cv[0].path;
            const cvName = req.files.cv[0].originalname.toLowerCase().replace(/\s/g, '-')

            // upload lecture media
            const cv = await Cloudinary.uploader.upload(path,
                {
                    public_id: `CVs/${req.user.username}/beta-ai-${cvName}-cv`,
                    resource_type: "raw",
                    use_filename: true,
                    tags: `${req.user.name}, cv`,
                    placeholder: true,
                }
            );

            application.cv = cv.secure_url;

            // remove file from server after save in storage
            if (cv) {
                fs.unlinkSync(path);
            }
        }

        await application.save();

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
        //don't forget add html code
        const message = {
            from: '"BetaAI Support" <no-reply@beta.ai>',
            to: req.user.email,
            subject: 'BetaAI Support',
            html: ``
        };

        transport.verify((error) => {
            if (error) {
                console.log(error)
            }
            else {
                console.log('server is redy to send email');

            }
        });

        transport.sendMail(message, async (error, body) => {
            if (error) {
                console.log(error)
                throw { status: 500, message: error.message || "email message about job details not sent", success: false };
            }
            else {

                // add this application to job in order to show it onLoad job to recruiter
                await Jobs.findByIdAndUpdate(req.body.job, { $set: { applications: application } }, {
                    new: true,
                    useFindAndModify: true
                });

                const applicationDetails = await JobApplication.findOne({ _id: application._id })
                    .populate([
                        {
                            path: 'user',
                            model: 'User'
                        },
                        {
                            path: 'job',
                            model: 'Job'
                        }
                    ])

                res.status(200).send({ status: 200, application: applicationDetails, success: true });
            }
        })
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.updateApplication = async (req, res) => {
    try {
        const profile = await JobApplication.findOne({ _id: req.query.application_id });

        // prevent application-update if recruiter deals with it
        if (!profile.in_consideration || !profile.canceled || !profile.viewed) {
            throw { status: 400, message: "Can not update profile.", success: false };
        }

        if (profile) {
            let application = await _.extend(profile, req.body);

            if (req.files.cv) {
                // get cv path
                const path = req.files.cv[0].path;
                const cvName = req.files.cv[0].originalname.toLowerCase().replace(/\s/g, '-')

                // upload lecture media
                const cv = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `CVs/${req.user.username}/beta-ai-${cvName}-cv`,
                        resource_type: "raw",
                        use_filename: true,
                        tags: `${req.user.name}, cv`,
                        placeholder: true,
                    }
                );

                application.cv = cv.secure_url;

                // remove file from server after save in storage
                if (cv) {
                    fs.unlinkSync(path);
                }
            }

            application.updatedAt = Date.now();
            await application.save();

            res.status(200).send({ status: 200, application, success: true });
        } else {
            throw { status: 404, message: "Application not found", success: false };
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.createComplaint = async (req, res) => {
    try {
        const complaint = await new Complaint({ ...req.body });
        complaint.user = req.user._id;

        if (req.files.image) {
            // get complaint img-path
            const path = req.files.image[0].path;

            // upload complaint media
            const cIMG = await Cloudinary.uploader.upload(path,
                {
                    public_id: `Complaints/${req.user.username}/beta-ai-${req.body.title}-cv`,
                    resource_type: "raw",
                    use_filename: true,
                    tags: `${req.body.title}, ${req.body.type}, complaint`,
                    placeholder: true,
                }
            );

            complaint.image = cIMG.secure_url;

            // remove file from server after save in storage
            if (cIMG) {
                fs.unlinkSync(path);
            }
        }

        res.status(200).send({
            status: 200,
            message: "With regret and sadness, we have received your complaint. Our team will work to solve it very soon and inform you.",
            success: true
        });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.saleCourses = async (req, res) => {
    const resultsPerPage = 9;
    const page = req.query.page ? req.query.page >= 1 ? req.query.page : 1 : 0;

    try {
        const saleCourses = await Payment.find({ buyer: req.user._id, type: 'course' })
        const courses = await Course.find({ _id: { $in: saleCourses.map(saleCourse => saleCourse.course) } }, {}, {
            limit: resultsPerPage,
            skip: page * resultsPerPage
        })
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

        res.status(200).send({ status: 200, courses, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.saleSingleCourse = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course })
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

        const saleCourse = await Payment.findOne({ buyer: req.user._id, course: course._id, type: 'course' })

        if (saleCourse.stillOpen) {
            res.status(200).send({ status: 200, course, success: true });
        }

        if (!saleCourse.stillOpen && saleCourse.price > 0) {
            throw { status: 400, message: 'course period expired, renew it', success: false }
        }

        if (!saleCourse.stillOpen && saleCourse.price === 0) {
            throw { status: 400, message: 'plan period expired, renew it', success: false }
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.getLecture = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course });
        const section = await Section.find({ slug: req.query.section });
        for (let i = 0; i < section.length; i++) {
            if (course.sections.includes(section[i]._id)) {
                const selectSection = await Section.findOne({ _id: section[i] });
                const lecture = await Lecture.find({ slug: req.query.lecture });
                for (let index = 0; index < lecture.length; i++) {
                    if (selectSection.lectures.includes(lecture[index]._id)) {
                        const selectLecture = await Lecture.findOne({ _id: lecture[index] });
                        return res.send({ status: 200, selectLecture, success: true });
                    }
                }
            }
        }
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.comment = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course })

        const saleCourse = await Payment.findOne({ buyer: req.user._id, course: course._id });
        if (saleCourse) {
            const comment = await new commentCourse({
                student: saleCourse.buyer,
                comment: req.body.comment
            });

            const notification = await new Notification({
                title: `Course: ${course.title} have a comment`,
                body: req.body.comment,
                sender: saleCourse.buyer,
                receivers: course.author,
            });
            await notification.save();
            await comment.save();

            const courseLastModified = await Course.findByIdAndUpdate(course._id, { $push: { comments: comment._id } }, { new: true })
                .populate({
                    path: "comments",
                    populate: {
                        path: 'student',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    }
                })

            const data = await Notification.findOne({ _id: notification._id })
                .populate([
                    {
                        path: 'sender',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    },
                    {
                        path: 'receivers',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    }
                ]);
            res.status(200).send({ status: 200, course: courseLastModified, notification: data, success: true });

        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.updateComment = async (req, res) => {
    try {
        const comment = await commentCourse.findOne({ _id: req.query.comment });
        const course = await Course.findOne({ comments: comment._id })
            .populate({
                path: "comments",
                populate: {
                    path: 'student',
                    model: 'User',
                    select: '_id name username email sex age image address phone government country level'
                }
            })

        const saleCourse = await Payment.findOne({ buyer: req.user._id, course: course._id });
        req.comment = comment;
        if (comment) {
            req.comment = _.extend(req.comment, req.body);
            req.comment.updatedAt = Date.now();

            const notification = await new Notification({
                title: `Course: ${course.title} have a comment`,
                body: req.body.comment,
                sender: saleCourse.buyer,
                receivers: course.author,
            });
            await notification.save();
            await req.comment.save();

            const data = await Notification.findOne({ _id: notification._id })
                .populate([
                    {
                        path: 'sender',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    },
                    {
                        path: 'receivers',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    }
                ]);
            res.status(200).send({ status: 200, course, notification: data, success: true });
        }
        else {
            throw { status: 400, message: 'comment is not exist', success: false };
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.rate = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course });
        const saleCourse = await Payment.findOne({ buyer: req.user._id, course: course._id });
        if (saleCourse) {
            const newRate = await new Rate({
                course: saleCourse.course,
                student: saleCourse.buyer,
                rate: req.body.rate,
                type: 'course'
            });

            await newRate.save();

            res.status(200).send({ status: 200, rate: newRate, success: true });
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.addNote = async (req, res) => {
    try {
        const lecture = await Lecture.findOne({ slug: req.query.lecture });
        const section = await Section.findOne({ lectures: lecture._id });
        const course = await Course.findOne({ sections: section._id });
        const saleCourse = await Payment.findOne({ buyer: req.user._id, course: course._id });
        if (course && section && lecture && saleCourse) {
            const note = await new Note({
                course: course._id,
                section: section._id,
                lecture: lecture._id,
                student: saleCourse.buyer,
                time: req.body.time,
                note: req.body.note
            });

            // send required notification to instructor
            const notification = await new Notification({
                title: `Course: ${course.title} in Section: ${section.title} in Lecture: ${lecture.name} in Time: ${req.body.time} have a note`,
                body: req.body.note,
                sender: saleCourse.buyer,
                receivers: course.author,
            });

            await note.save();
            await notification.save();

            const data = await Notification.findOne({ _id: notification._id })
                .populate([
                    {
                        path: 'sender',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    },
                    {
                        path: 'receivers',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    }
                ]);
            res.status(200).send({ status: 200, notification: data, success: true });
        }
        else {
            throw { status: 400, message: "cann't save a note", success: false };
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.question = async (req, res) => {
    try {
        const lecture = await Lecture.findOne({ slug: req.query.lecture });
        const section = await Section.findOne({ lectures: lecture._id });
        const course = await Course.findOne({ sections: section._id });
        const saleCourse = await Payment.findOne({ buyer: req.user._id, course: course._id });
        if (course && section && lecture && saleCourse) {
            const slugQuestion = slugify(req.body.question, { replacement: '-', lower: true });
            const question = await new Question({
                course: course._id,
                section: section._id,
                lecture: lecture._id,
                student: saleCourse.buyer,
                slug: slugQuestion,
                ...req.body
            });
            if (typeof req.files === "object") {

                if (req.files.image) {

                    // get image path
                    const path = req.files.image[0].path;

                    // upload question image
                    const question_img = await Cloudinary.uploader.upload(path,
                        {
                            public_id: `questions/${lecture.slug}/beta-ai-${lecture.slug}-main-image`,
                            use_filename: true,
                            tags: `question, ${lecture.slug}, banner, ${lecture.slug}`,
                            // width: 500,
                            // height: 500,
                            // crop: "scale",
                            placeholder: true
                        }
                    );

                    question.image = question_img;

                    // remove file from server after save in storage
                    if (question_img) {
                        fs.unlinkSync(path);
                    }
                }
            }

            // send required notification to instructor
            const notification = await new Notification({
                title: `Course: ${course.title} in Section: ${section.title} in Lecture: ${lecture.name} have a question`,
                body: req.body.question,
                sender: saleCourse.buyer,
                receivers: course.author,
            });
            await question.save();
            await Lecture.findByIdAndUpdate(lecture._id, { $push: { questions: question._id } }, { new: true });
            await notification.save();

            const data = await Question.findOne({ lecture: lecture._id }).populate("student", "_id name age image");
            const notificationData = await Notification.findOne({ _id: notification._id })
                .populate([
                    {
                        path: 'sender',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    },
                    {
                        path: 'receivers',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    }
                ]);
            res.status(200).send({ status: 200, question: data, notification: notificationData, success: true });
        }
        else {
            throw { status: 400, message: "cann't save a question", success: false };
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.updateQuestion = async (req, res) => {
    try {
        const question = await Question.findOne({ _id: req.query.question }).populate("student", "_id name age image");
        const lecture = await Lecture.findOne({ lecture: question.lecture })
        if (question) {
            req.question = question
            if (typeof req.files === "object") {

                if (req.files.image) {

                    // get image path
                    const path = req.files.image[0].path;

                    // upload question image
                    const question_img = await Cloudinary.uploader.upload(path,
                        {
                            public_id: `questions/${lecture.slug}/beta-ai-${lecture.slug}-main-image`,
                            use_filename: true,
                            tags: `question, ${lecture.slug}, banner, ${lecture.slug}`,
                            // width: 500,
                            // height: 500,
                            // crop: "scale",
                            placeholder: true
                        }
                    );

                    req.question.image = question_img;

                    // remove file from server after save in storage
                    if (question_img) {
                        fs.unlinkSync(path);
                    }
                }
            }

            req.question = _.extend(req.question, { ...req.body });

            req.question.updatedAt = Date.now();
            await req.question.save();

            res.status(200).send({ status: 200, question: req.question, success: true });
        }
        else {
            throw { status: 400, message: "question is not exist", success: false }
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.answer = async (req, res) => {
    try {
        const question = await Question.findOne({ slug: req.query.question });
        const course = await Course.findOne({ _id: question.course })
        const section = await Section.findOne({ _id: question.section })
        const lecture = await Lecture.findOne({ _id: question.lecture })
        if (question && course && section && lecture) {
            const answer = await new Answer({
                question: question._id,
                user: req.user._id,
                ...req.body
            });
            if (typeof req.files === "object") {

                if (req.files.image) {

                    // get image path
                    const path = req.files.image[0].path;

                    // upload question image
                    const answer_img = await Cloudinary.uploader.upload(path,
                        {
                            public_id: `answers/${question.slug}/beta-ai-${question.slug}-main-image`,
                            use_filename: true,
                            tags: `answer, ${question.slug}, banner, ${question.slug}`,
                            // width: 500,
                            // height: 500,
                            // crop: "scale",
                            placeholder: true
                        }
                    );

                    answer.image = answer_img;

                    // remove file from server after save in storage
                    if (answer_img) {
                        fs.unlinkSync(path);
                    }
                }
            }

            const notification = await new Notification({
                title: `Course: ${course.title} in Section: ${section.title} in Lecture: ${lecture.name} have a question`,
                body: req.body.answer,
                sender: req.user._id,
                receivers: question.student,
            });

            await answer.save();
            await Question.findByIdAndUpdate(question._id, { $push: { answers: answer._id } }, { new: true });
            await notification.save()

            const data = await Answer.findOne({ answer: req.body.answer }).populate("user", "_id name age image");
            const notificationData = await Notification.findOne({ _id: notification._id })
                .populate([
                    {
                        path: 'sender',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    },
                    {
                        path: 'receivers',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    }
                ]);

            res.status(200).send({ status: 200, answer: data, notification: notificationData, success: true });
        }
        else {
            throw { status: 400, message: "question is not exist", success: false }
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.updateAnswer = async (req, res) => {
    try {
        const answer = await Answer.findOne({ _id: req.query.answer }).populate("user", "_id name age image");
        const question = await Question.findOne({ answers: answer._id });
        const course = await Course.findOne({ _id: question.course })
        const section = await Section.findOne({ _id: question.section })
        const lecture = await Lecture.findOne({ _id: question.lecture })
        if (answer) {
            req.answer = answer
            if (typeof req.files === "object") {

                if (req.files.image) {

                    // get image path
                    const path = req.files.image[0].path;

                    // upload question image
                    const answer_img = await Cloudinary.uploader.upload(path,
                        {
                            public_id: `answers/${question.slug}/beta-ai-${question.slug}-main-image`,
                            use_filename: true,
                            tags: `answer, ${question.slug}, banner, ${question.slug}`,
                            // width: 500,
                            // height: 500,
                            // crop: "scale",
                            placeholder: true
                        }
                    );

                    req.answer.image = answer_img;

                    // remove file from server after save in storage
                    if (answer_img) {
                        fs.unlinkSync(path);
                    }
                }
            }

            req.answer = _.extend(req.answer, { ...req.body });
            req.answer.updatedAt = Date.now();
            await req.answer.save();

            const notification = await new Notification({
                title: `Course: ${course.title} in Section: ${section.title} in Lecture: ${lecture.name} have a question`,
                body: req.body.answer,
                sender: answer.user,
                receivers: question.student,
            });
            await notification.save()

            const notificationData = await Notification.findOne({ _id: notification._id })
                .populate([
                    {
                        path: 'sender',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    },
                    {
                        path: 'receivers',
                        model: 'User',
                        select: '_id name username email sex age image address phone government country level'
                    }
                ]);

            res.status(200).send({ status: 200, answer: req.answer, notification: notificationData, success: true });
        }
        else {
            throw { status: 400, message: "answer is not exist", success: false }
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.studentAnswer = async (req, res) => {
    try {
        const question = await quizItem.findOne({ _id: req.query.question });

        const studentAnswer = await new quizAnswer({ ...req.body });

        studentAnswer.student = req.user._id;
        studentAnswer.quest = req.query.question;

        // if there is no answer, mark question as 'false'
        if (req.body.answer && question.answer === studentAnswer.answer) {
            studentAnswer.valid = true;
        }

        await studentAnswer.save();

        let result = {};
        if (studentAnswer.valid) {
            result.valid = true;
        } else {
            result.valid = false;
            result.correction = question.answer;
        }

        res.status(200).send({ status: 200, result, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

// setup active-win and active-window library and python 
exports.activeWindowPro = async (req, res) => {
    try {
        console.log(await activeWindow(screenRecordingPermission('windows')));

        // aWindow.getActiveWindow(async (window) => {
        //     console.log("App: " + window.app);
        //     console.log(window.app.includes('zoom'))
        //     if (window.app.includes('zoom')) {
        //         console.log('hi')
        //         res.send({ message: 'zoom is active' })
        //     }
        //     else {
        //         res.send();
        //     }
        // 
        // })
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}