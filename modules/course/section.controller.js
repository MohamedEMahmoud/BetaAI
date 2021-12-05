const db = require(__dirname + "/../../models"),
    Section = db.section,
    Course  = db.course,
    _       = require("lodash");

exports.createSection = async (req, res) => {
    try {
        const course_slug = await Course.findOne({ slug: req.query.course });

        if (!course_slug) {
            throw { status: 404, message: "course does not exist", success: false };
        }

        const sections = await Section.find({ _id: {$in: course_slug.sections} });
        
        const slugTitle = req.body.title.toLowerCase().replace(/\s/g, '-');

        const sectionExist = sections.map(section => section.slug.includes(slugTitle)).includes(true);

        if (sectionExist) {
            throw { status: 400, message: "Section exists", success: false }
        }

        const section = await new Section(req.body);
        section.slug = slugTitle;

        const course = await Course.findByIdAndUpdate(course_slug._id, { $push: { sections: section._id } }, { new: true })

        const history = {
            created_by: req.user.email,
            event: `create Section: ${section.title} in Course: ${course_slug.name}`,
            ...req.body,
            slug: slugTitle,
            created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
            time: (`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`)
        }
        course.history = [...course.history, history]

        await course.save();
        await section.save();

        const population = await Course.findOne({ slug: req.query.course })
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

        res.status(200).send({ status: 200, course: population, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.updateSection = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course })

        req.section = _.extend(
            req.section, {
            ...req.body,
            slug: req.body.title ? req.body.title.toLowerCase().replace(/\s/g, '-') : req.section.slug
        });
        req.section.updatedAt = Date.now();

        if (req.body.title) {
            const history = {
                created_by: req.user.email,
                event: `update Section: ${req.section.title} in Course: ${course.title}`,
                ...req.body,
                slug: req.body.title ? req.body.title.toLowerCase().replace(/\s/g, '-') : req.section.slug,
                created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
                time: (`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`)
            }
            course.history = [...course.history, history]
        }
        else {
            const history = {
                created_by: req.user.email,
                event: `update Section: ${req.section.title} in Course: ${course.title}`,
                ...req.body,
                created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
                time: (`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`)
            }
            course.history = [...course.history, history]
        }
        await course.save();
        await req.section.save();

        res.send({ status: 202, section: req.section, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.removeSection = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.query.courseId, { $pull: { sections: req.section._id } })
        const history = {
            created_by: req.user.email,
            event: `remove Section: ${req.section.title} in Course: ${course.title}`,
            ...req.section._doc,
            created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
            time: (`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`)
        }
        course.history = [...course.history, history]

        await course.save();
        await req.section.remove();

        res.status(204).send({ status: 204, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}