const db = require(__dirname + "/../../models"),
    Lecture         = db.lecture,
    Section         = db.section,
    Course          = db.course,
    Watch           = db.watch,
    Rate            = db.rate,
    Payment         = db.payment,
    commentLecture  = db.commentsLecture,
    Cloudinary      = require("cloudinary").v2,
    fs              = require('fs'),
    _               = require("lodash");

exports.createLecture = async (req, res) => {
    try {
        const slugName = req.body.name.toLowerCase().replace(/\s/g, '-');

        const course = await Course.findOne({ slug: req.query.course });

        const sections = await Section.find();

        let sectionId;

        for (let i = 0; i < sections.length; i++) {
            if (course.sections[i].equals(sections[i]._id)) {
                sectionId = course.sections.filter(section => section.equals(sections[i]._id))[0];
                break;
            }
        }
        const section_slug = await Section.findOne({_id: sectionId})

        const lectures = await Lecture.find({ _id: {$in: section_slug.lectures} });

        const lectureExist = lectures.map(lecture => lecture.slug.includes(slugName)).includes(true)

        if (lectureExist) {
            throw { status: 400, message: "Lecture exists", success: false }
        }

        const lecture = await new Lecture({ ...req.body });
        lecture.slug = slugName;

        if (!req.query.section) {
            throw { status: 404, message: "section does not exits", success: false };
        }

        if (!req.query.course) {
            throw { status: 404, message: "course does not exits", success: false };
        }

        let coursePoints = course.points;
        coursePoints += req.body.points;
        if (course.points > coursePoints) {
            throw { status: 400, message: `points course larger than ${course.points} can not upload any lecture before edit all points of lectures` }
        }

        if (typeof req.files === "object") {
            if (req.files.thumbnail) {
                // get thumbnail path
                const path = req.files.thumbnail[0].path;

                // upload lecture thumbnail
                const thumbnail = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${section_slug.slug}/${slugName}/beta-ai-${slugName}-main-image`,
                        use_filename: true,
                        tags: `lecture, ${slugName}, ${course.slug}, ${section_slug.slug}, thumbnail`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true,
                    }
                );

                lecture.thumbnail = thumbnail.secure_url;

                // remove file from server after save in storage
                if (thumbnail) {
                    fs.unlinkSync(path);
                }
            }

            if (req.files.preview_lecture) {
                // get lecture-preview path
                const path = req.files.preview_lecture[0].path;

                // upload lecture preview
                const lec_prev = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${section_slug.slug}/${slugName}/beta-ai-${slugName}-lecture-prev`,
                        resource_type: "video",
                        use_filename: true,
                        tags: `lecture, ${slugName}, ${course.slug}, ${section_slug.slug}, preview`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true,
                    }
                );

                lecture.preview_lecture = lec_prev.secure_url;

                // remove file from server after save in storage
                if (lec_prev) {
                    fs.unlinkSync(path);
                }
            }

            if (req.files.lecture_video) {
                // get lecture-video path
                const path = req.files.lecture_video[0].path;

                // upload lecture video
                const lec = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${section_slug.slug}/${slugName}/beta-ai-${slugName}-lecture`,
                        resource_type: "video",
                        use_filename: true,
                        tags: `lecture, ${slugName}, ${course.slug}, ${section_slug.slug}`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true,
                    }
                );

                lecture.lecture_video = lec.secure_url;

                // remove file from server after save in storage
                if (lec) {
                    fs.unlinkSync(path);
                }
            }
            
            if (req.files.media) {
                // get media path
                const path = req.files.media[0].path;
                const mediaName = req.files.media[0].originalname.toLowerCase().replace(/\s/g, '-')

                // upload lecture media
                const lec_media = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${section_slug.slug}/${slugName}/beta-ai-${mediaName}-media`,
                        resource_type: "raw",
                        use_filename: true,
                        tags: `lecture, ${slugName}, ${course.slug}, ${section_slug.slug}, media`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true,
                    }
                );

                lecture.media = lec_media.secure_url;

                // remove file from server after save in storage
                if (lec_media) {
                    fs.unlinkSync(path);
                }
            }
        }

        const history = {
            created_by: req.user.email,
            event: `create Lecture: ${lecture.name} in Section: ${section_slug.title} in Course: ${course.title}`,
            ...req.body,
            ...req.files,
            slug: slugName,
            created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
            time: (`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`)
        }

        course.history = [...course.history, history]

        await lecture.save();
        await Section.findByIdAndUpdate(section_slug._id, { $push: { lectures: lecture._id } }, { new: true });
        await course.save();

        const population = await Section.findOne({ _id: section_slug._id })
            .populate({
                path: "lectures",
            }).exec();
        res.status(200).send({ status: 200, section: population, success: true });

    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.updateLecture = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course })
        const section = await Section.findOne({ lectures: req.lecture._id })

        if (typeof req.files === "object") {
            if (req.files.thumbnail) {
                // get thumbnail path
                const path = req.files.thumbnail[0].path;

                // upload lecture thumbnail
                const thumbnail = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${section.slug}/${req.lecture.slug}/beta-ai-${req.lecture.slug}-main-image`,
                        use_filename: true,
                        tags: `lecture, ${req.lecture.slug}, ${course.slug}, ${section.slug}, thumbnail`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true,
                    }
                );

                req.lecture.thumbnail = thumbnail.secure_url;

                // remove file from server after save in storage
                if (thumbnail) {
                    fs.unlinkSync(path);
                }
            }

            if (req.files.preview_lecture) {
                // get lecture-preview path
                const path = req.files.preview_lecture[0].path;

                // upload lecture preview
                const lec_prev = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${section.slug}/${req.lecture.slug}/beta-ai-${req.lecture.slug}-lecture-prev`,
                        resource_type: "video",
                        use_filename: true,
                        tags: `lecture, ${req.lecture.slug}, ${course.slug}, ${section.slug}, preview`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true,
                    }
                );

                req.lecture.preview_lecture = lec_prev.secure_url;

                // remove file from server after save in storage
                if (lec_prev) {
                    fs.unlinkSync(path);
                }
            }

            if (req.files.lecture_video) {
                // get lecture-video path
                const path = req.files.lecture_video[0].path;

                // upload lecture video
                const lec = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${section.slug}/${req.lecture.slug}/beta-ai-${req.lecture.slug}-lecture`,
                        resource_type: "video",
                        use_filename: true,
                        tags: `lecture, ${req.lecture.slug}, ${course.slug}, ${section.slug}`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true,
                    }
                );

                req.lecture.lecture_video = lec.secure_url;

                // remove file from server after save in storage
                if (lec) {
                    fs.unlinkSync(path);
                }
            }
            
            if (req.files.media) {
                // get media path
                const path = req.files.media[0].path;
                const mediaName = req.files.media[0].originalname.toLowerCase().replace(/\s/g, '-')

                // upload lecture media
                const lec_media = await Cloudinary.uploader.upload(path,
                    {
                        public_id: `courses/${course.slug}/sections/${section.slug}/${req.lecture.slug}/beta-ai-${mediaName}-media`,
                        resource_type: "raw",
                        use_filename: true,
                        tags: `lecture, ${req.lecture.slug}, ${course.slug}, ${section.slug}, media`,
                        // width: 500,
                        // height: 500,
                        // crop: "scale",
                        placeholder: true,
                    }
                );

                req.lecture.media = lec_media.secure_url;

                // remove file from server after save in storage
                if (lec_media) {
                    fs.unlinkSync(path);
                }
            }
        }

        req.lecture = _.extend(
            req.lecture, {
            ...req.body,
            slug: req.body.name ? req.body.name.toLowerCase().replace(/\s/g, '-') : req.lecture.slug
        });

        req.lecture.updatedAt = Date.now();

        if (req.body.name) {
            const history = {
                created_by: req.user.email,
                event: `update Lecture: ${req.lecture.name} in Section: ${section.title} in Course: ${course.title} `,
                ...req.body,
                ...req.files,
                slug: req.body.name ? req.body.name.toLowerCase().replace(/\s/g, '-') : req.lecture.slug,
                created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
                time: (`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`)
            }
            course.history = [...course.history, history]
        }
        else {
            const history = {
                created_by: req.user.email,
                event: `update Lecture: ${req.lecture.name} in Section: ${section.title} in Course: ${course.title} `,
                ...req.body,
                ...req.files,
                created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
                time: (`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`)
            }
            course.history = [...course.history, history]
        }

        await course.save();
        await req.lecture.save();

        res.send({ status: 202, lecture: req.lecture, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.removeLecture = async (req, res) => {
    try {
        const section = await Section.findByIdAndUpdate(req.query.sectionId, { $pull: { lectures: req.lecture._id } })
        const course = await Course.findOne({ slug: req.query.course })

        const history = {
            created_by: req.user.email,
            event: `remove Lecture: ${req.lecture.name} in Section: ${section.title} in Course: ${course.title}`,
            ...req.lecture._doc,
            created_at: (`${new Date().getDate()}/${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`),
            time: (`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`)
        }
        course.history = [...course.history, history]

        await course.save();
        await req.lecture.remove();

        res.status(204).send({ status: 204, success: true, });
    } catch (error) {
        res.status(400).send({ status: 400, message: error.message, success: false });
    }
}

exports.lectureRate = async (req, res) => {
    try {
        const lecture = await Lecture.findOne({ slug: req.query.lecture });
        const section = await Section.findOne({ lectures: lecture._id });
        const course = await Course.findOne({ sections: section._id });
        const saleCourse = await Payment.findOne({ buyer: req.user._id, course: course._id });
        if (saleCourse) {
            const newRate = await new Rate({
                course: course._id,
                section: section._id,
                lecture: lecture._id,
                student: saleCourse.buyer,
                rate: req.body.rate,
                type: 'lecture'
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

exports.getLectureRate = async (req, res) => {
    try {
        res.status(200).send({ status: 200, lecture: req.lecture, success: true })
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}
exports.lectureComment = async (req, res) => {
    try {
        const comment = await new commentLecture({
            student: req.user._id,
            comment: req.body.comment
        })
        await comment.save()
        await Lecture.findByIdAndUpdate(req.lecture._id, { $push: { comments: comment._id } }, { new: true })
        res.status(200).send({ status: 200, comment, success: true })
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}
exports.getLectureComment = async (req, res) => {
    try {
        res.status(200).send({ status: 200, lecture: req.lecture, success: true })
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.watchLecture = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course });
        const lecture = await Lecture.findOne({ slug: req.query.lecture });
        const student = await Watch.findOne({ student: req.user._id, course: course._id });

        if (student) {
            student.lectures = [...student.lectures, lecture._id];
            student.points += lecture.points;

            await student.save();

            if (student.points === course.points) {
                return res.status(200).send({ status: 200, progress: {student, courseEnded: true}, success: true });
            }

            res.status(200).send({ status: 200, progress: {student, courseEnded: false}, success: true });
        }
        else {
            const watch = await new Watch({
                lectures: lecture._id,
                student: req.user._id,
                course: course._id,
                points: lecture.points
            });
            await watch.save();

            res.status(200).send({ status: 200, progress: watch, success: true });
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}