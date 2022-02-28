const db = require(__dirname + "/../../models"),
    _ = require("lodash"),
    nodemailer = require("nodemailer"),
    Notification = db.notification,
    User = db.user,
    Course = db.course,
    Payments = db.payment,
    slugify = require('slugify'),
    Role = db.role,
    { OAuth2Client } = require('google-auth-library'),
    Cloudinary = require("cloudinary").v2,
    fs = require('fs');

const sendMail = async (req, res, receiver, notification) => {
    let role;
    const adminRole = await Role.findOne({ name: "admin" });
    const sender = await User.findOne({ _id: req.user._id });
    if (sender.roles.includes(adminRole._id)) {
        role = "admin";
    } else {
        role = "instructor"
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
        from: role === "admin" ? '"BetaAI" <no-reply@beta.ai>' : `"BetaAI Instructor: ${sender.name.charAt(0)}" <no-reply@beta.ai>`,
        to: receiver,
        subject: `${notification.title}`,
        // todo: create notification-email block!
        html: `
            <div style="text-align: center;  font-family: sans-serif">
            
                <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                    <p style="font-size: 16px">
                      ${notification.body}
                    </p>
                </div>

                <div style="margin: 20px; background: transparent; color: #041438">
                    <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                        <a  style="color: #041438; text-transform: uppercase;" href=${process.env.SERVER_URL}/help target="_blank">contact us</a>
                    </p>
                    <p style="margin: 20px 0; direction: ltr">&copy; 2020 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
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
                message: error.message || "email message about notification not sent",
                success: false
            };
        }
        else {
            console.log(`Email Sent ${body.response}`);
        }
    });
}


exports.sendNotification = async (req, res) => {
    try {
        // admin-role validation!
        const adminRole = await Role.findOne({ name: "admin" });
        const sender = await User.findOne({ _id: req.user._id });

        let users;
        const notification = await new Notification({
            ...req.body,
            media: await notificationMedia(req),
            image: await notificationImage(req)
        });
        notification.sender = req.user._id;

        if (req.body.to === "all" && sender.roles.includes(adminRole._id)) {
            users = await User.find({});
            users.map(user => {
                notification.receivers.push(user._id);
            });
        } else if (req.body.to === "all" && !sender.roles.includes(adminRole._id)) {
            throw { status: 401, message: "Unauthorized", success: false };
        }
        // to specific course students - with slug
        else if (req.body.to === "course") {
            if (req.body.course) {
                let usersList = [];
                const course = await Course.findOne({ slug: req.body.course });
                users = await Payments.find({ course: course._id });
                users.map(user => usersList.push(user.buyer));
                notification.receivers = await Object.values(usersList.reduce((a, c) => (a[`${c.course}`] = c, a), {}));
                notification.global = false;
            } else {
                throw { status: 422, message: "You should choose valid course", success: false };
            }
        }

        await notification.save();

        notification.receivers.map(async receiver => {
            const user = await User.findOne({ _id: receiver });
            await sendMail(req, res, user.email, notification);
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
        res.status(200).send({ status: 200, notification: data, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.showAllUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ receivers: req.user._id })
            .populate([
                {
                    path: 'sender',
                    model: 'User',
                    select: '_id name username email sex age image address phone government country level'
                }
            ]);
        res.status(200).send({ status: 200, notifications, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.showAllSenderNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ sender: req.user._id })
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
        res.status(200).send({ status: 200, notifications, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.showAdminNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ global: true })
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
        res.status(200).send({ status: 200, notifications, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.updateNotificationStatus = async (req, res) => {
    try {
        const notifications = await Notification.findByIdAndUpdate(req.query.notification, { seen: true }, { new: true, useFindAndModify: true });
        res.status(200).send({ status: 200, notifications, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.findNotifications = async (req, res) => {
    const items = req.query.items ? req.query.items : 6;
    const page = req.query.page ? req.query.page > 1 ? req.query.page : 1 : 0;

    try {
        let queryObject = {};

        // case 1 - if sender exists!
        if (req.query.sender) {
            const sender = await User.findOne({ name: req.query.sender });
            queryObject.sender = sender._id;
        }

        // case 2 - if status exists!
        if (req.query.status) {
            queryObject.seen = Boolean(req.query.status);
        }

        if (req.query.title) {
            queryObject.title = { "$regex": req.query.title, "$options": "i" }
        }

        const notifications = await Notification.find(queryObject, {}, { limit: items, skip: page * 6 });
        res.status(200).send({ status: 200, notifications, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

exports.notificationCourse = async (req, res) => {
    try {
        const courses = await Course.find({ owner: req.user._id });
        const Title_slug = await Promise.all(courses.map(course => {
            return {
                _id: course._id,
                title: course.title,
                slug: course.slug
            }
        }));
        res.status(200).send({ status: 200, courses: Title_slug, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}


exports.notificationCourses = async (req, res) => {
    try {
        const courses = await Course.find({ _id: { $in: req.query.course } })
        const saleCourses = await Payments.find({ course: courses.map(course => course._id), type: 'course' });
        if (saleCourses.length === 0) {
            throw { status: 400, message: "buyers dosen't exist", success: false }
        }
        else {
            const notification = await new Notification({
                ...req.body,
                sender: req.user._id,
                receivers: [...new Set(saleCourses.map(course => course.buyer.toString()))],
                media: await notificationMedia(req),
                image: await notificationImage(req),
            });

            await notification.save();

            const population = await Notification.findOne({ _id: notification._id })
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
            res.status(200).send({ status: 200, notification: population, success: true });
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

const notificationMedia = async (req) => {
    if (typeof req.files === "object") {
        if (req.files.media) {

            const slugTitle = slugify(req.body.title, { replacement: '-', lower: true });

            // get media path
            const path = req.files.media[0].path;
            const mediaName = req.files.media[0].originalname.toLowerCase().replace(/\s/g, '-')

            // upload lecture media
            const notification_media = await Cloudinary.uploader.upload(path,
                {
                    public_id: `notification/${slugTitle}/beta-ai-${mediaName}-media`,
                    resource_type: "raw",
                    use_filename: true,
                    tags: `notification,${slugTitle}, media`,
                    // width: 500,
                    // height: 500,
                    // crop: "scale",
                    placeholder: true,
                }
            );

            // remove file from server after save in storage
            if (notification_media) {
                fs.unlinkSync(path);
            }
            return notification_media.secure_url;
        }
    }
}

const notificationImage = async (req) => {
    if (typeof req.files === "object") {
        if (req.files.image) {

            const slugTitle = slugify(req.body.title, { replacement: '-', lower: true });

            // get image path
            const path = req.files.image[0].path;
            const imageName = req.files.image[0].originalname.toLowerCase().replace(/\s/g, '-');

            // upload lecture image
            const notification_Image = await Cloudinary.uploader.upload(path,
                {
                    public_id: `notification/${slugTitle}/beta-ai-${imageName}-image`,
                    resource_type: "raw",
                    use_filename: true,
                    tags: `notification,${slugTitle}, image`,
                    // width: 500,
                    // height: 500,
                    // crop: "scale",
                    placeholder: true,
                }
            );

            // remove file from server after save in storage
            if (notification_Image) {
                fs.unlinkSync(path);
            }  
            return notification_Image.secure_url;
        }
    }
}