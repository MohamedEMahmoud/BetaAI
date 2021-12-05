const db = require(__dirname + "/../../models"),
    Section = db.section,
    Course = db.course,
    Quiz = db.quiz,
    quizItem = db.quizItem,
    Cloudinary = require("cloudinary").v2,
    fs = require("fs"),
    slugify = require('slugify'),
    _ = require("lodash");

exports.createQuiz = async (req, res) => {
    try {
        const quizExist = await Quiz.findOne({ name: req.body.name });
        const course = await Course.findOne({ sections: req.section._id });

        if (quizExist) {
            throw { status: 404, message: "quiz is Exist", success: false };
        } else {
            const quiz = await new Quiz({ ...req.body });

            const history = {
                created_by: req.user.email,
                section: req.section,
                event: `create quiz: ${quiz.name} in Section: ${req.section.title}`,
                quiz: quiz,
                created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
                time: (`${new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).toUpperCase()}`)
            }

            course.history = [...course.history, history];


            await quiz.save();
            await Section.findByIdAndUpdate(req.section._id, { $push: { quizzes: quiz._id } }, { new: true });
            await course.save();

            res.status(200).send({ status: 200, quiz, success: true });
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ name: req.query.quiz });
        const course = await Course.findOne({ sections: req.section._id });
        if (quiz) {
            req.quiz = quiz;

            req.quiz = _.extend(req.quiz, { ...req.body });
            req.quiz.updatedAt = Date.now();

            const history = {
                created_by: req.user.email,
                section: req.section,
                event: `update quiz: ${req.quiz.name} Section: ${req.section.title}`,
                quiz: req.quiz,
                created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
                time: (`${new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).toUpperCase()}`)
            }

            course.history = [...course.history, history];

            await req.quiz.save();
            await course.save();

            res.status(200).send({ status: 200, quiz: req.quiz, success: true });
        } else {
            throw { status: 400, message: "quiz is not exist", success: false }
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.removeQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ name: req.query.quiz });
        const quiz_Item = await quizItem.find({ _id: quiz.quizItems });
        const course = await Course.findOne({ sections: req.section._id });

        const history = {
            created_by: req.user.email,
            event: `remove quiz: ${quiz.name} in Section: ${req.section.title}`,
            section: req.section,
            ...quiz._doc,
            created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
            time: (`${new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).toUpperCase()}`)
        }

        course.history = [...course.history, history];


        for (let i = 0; i < quiz_Item.length; i++) {
            await quiz_Item[i].remove()
        }
        await quiz.remove();
        await Section.findByIdAndUpdate(req.section._id, { $pull: { quizzes: quiz._id } });
        await course.save();

        res.status(204).send({ status: 204, success: true, });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.createQuizItem = async (req, res) => {
    try {
        let question_slug = await slugify(req.body.question, { replacement: '-', lower: true });
        const course = await Course.findOne({ sections: req.section._id });
        const quiz_Item = await new quizItem({ ...req.body });

        let choices = {
            a: req.body.a,
            b: req.body.b,
            c: req.body.c,
            d: req.body.d
        };

        quiz_Item.choices = req.body.type === 'choices' ? [choices] : undefined;

        if (typeof req.files === "object") {

            if (req.files.image) {

                // get image path
                const path = req.files.image[0].path;

                // upload quiz image
                const quiz_Item_img = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${req.section.slug}/quizzes/beta-ai-${question_slug}`,
                        use_filename: true,
                        tags: `quiz, ${req.section.slug}, question, ${req.section.slug}`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true
                    }
                );

                quiz_Item.image = quiz_Item_img.secure_url;

                // remove file from server after save in storage
                if (quiz_Item_img) {
                    fs.unlinkSync(path);
                }
            }
        }

        await quiz_Item.save();

        if (!req.query.quiz) {
            throw { status: 400, message: "Quiz id is required", success: false }
        }

        const quiz = await Quiz.findOneAndUpdate(req.query.quiz, { $push: { quizItems: quiz_Item._id } }, { new: true });

        const history = {
            created_by: req.user.email,
            section: req.section,
            event: `Create new question for quiz: ${quiz.name} in Section: ${req.section.title}`,
            quiz: quiz,
            quizItem: quiz_Item,
            created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
            time: (`${new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).toUpperCase()}`)
        }

        course.history = [...course.history, history];

        await course.save();

        const data = await Quiz.find({ _id: quiz._id }).populate("quizItems");

        res.status(200).send({ status: 200, quiz: data, success: true });

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.updateQuizItem = async (req, res) => {
    try {
        const quiz_Item = await quizItem.findOne({ _id: req.query.quizItem })
        const quiz = await Quiz.findOne({ quizItems: quiz_Item._id })
        const course = await Course.findOne({ sections: req.section._id })
        if (quiz_Item) {

            req.quiz_Item = quiz_Item;

            if (typeof req.files === "object") {
                if (req.files.image) {
                    req.quiz_Item.image.data = req.files.image[0].buffer;
                }
            }

            req.quiz_Item = _.extend(req.quiz_Item, { ...req.body });
            req.quiz_Item.updatedAt = Date.now();

            const history = {
                created_by: req.user.email,
                section: req.section,
                event: `update question in quiz: ${quiz.name} in Section: ${req.section.title}`,
                quizItem: req.quiz_Item,
                created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
                time: (`${new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).toUpperCase()}`)
            }
            course.history = [...course.history, history]

            await req.quiz_Item.save();
            await course.save()
            res.status(200).send({ status: 200, question: req.quiz_Item, success: true })
        } else {
            throw { status: 400, message: "question is not exist", success: false }
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.removeQuizItem = async (req, res) => {
    try {
        const quiz_Item = await quizItem.findOne({ _id: req.query.quizItem })
        const course = await Course.findOne({ sections: req.section._id })
        const quiz = await Quiz.findOneAndUpdate(req.query.quiz, { $pull: { quizItems: quiz_Item._id } });

        const history = {
            created_by: req.user.email,
            event: `remove question in quiz: ${quiz.name} in Section: ${req.section.title}`,
            section: req.section,
            ...quiz_Item._doc,
            created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
            time: (`${new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).toUpperCase()}`)
        }
        course.history = [...course.history, history]

        await quiz_Item.remove();
        await course.save();
        res.status(204).send({ status: 204, success: true, });

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.calcStudentScore = async (req, res) => {
    try {
        res.status(200).send({ status: 200, result: req.result, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}