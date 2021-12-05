const { auth, handleErrors, fileValidation, preValidation } = require(__dirname + "/../../middlewares"),
    controller = require(__dirname + "/controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin",
        );
        next();
    });

    app.post("/notification/send", [auth.Jwt.verifyToken,
    fileValidation.upload.fields([
        { name: 'media', maxCount: 1 },
        { name: 'image', maxCount: 1 }
    ]),
    preValidation.createNotification,
    fileValidation.validationPhoto,
    fileValidation.validationMedia,
    ], controller.sendNotification, handleErrors);

    // update notification status
    app.patch("/notification", [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.updateNotificationStatus, handleErrors);

    // find notifications with queries
    app.get("/notification", [auth.Jwt.verifyToken], controller.findNotifications, handleErrors);

    app.get("/notification/receiver", [auth.Jwt.verifyToken], controller.showAllUserNotifications, handleErrors);

    app.get("/notification/sender", [auth.Jwt.verifyToken], controller.showAllSenderNotifications, handleErrors);

    app.get("/notification/admin", [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.showAdminNotifications, handleErrors);

    // instructor (owner) send notification to student course
    app.post('/notification/instructor', [auth.Jwt.verifyToken, auth.Jwt.isInstructor], controller.notificationCourse, handleErrors);

    // instructor (owner) send notification to students courses
    app.post('/notification/courses/student',
        [auth.Jwt.verifyToken, auth.Jwt.isInstructor,
        fileValidation.upload.fields([
            { name: 'media', maxCount: 1 },
            { name: 'image', maxCount: 1 }
        ]),
        preValidation.createNotification,
        fileValidation.validationPhoto,
        fileValidation.validationMedia,
        ],
        controller.notificationCourses, handleErrors);


};