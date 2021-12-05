const { auth, handleErrors, preValidation, fileValidation } = require(__dirname + "/../../middlewares"),
    accountController = require(__dirname + "/controller"),
    courseController = require(__dirname + "/../course/course.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin",
        );
        next();
    });

    // become an instructor
    app.post('/instructor/account', [auth.Jwt.verifyToken, fileValidation.upload.none(), preValidation.createInstructorAccount], accountController.createInstructorAccount, handleErrors);

    // get instructor account
    app.get('/instructor/account', [auth.Jwt.verifyToken, auth.Jwt.isInstructor], accountController.getInstructorAccount, handleErrors);

    // get instructor cards
    app.get('/instructor/card', [auth.Jwt.verifyToken, auth.Jwt.isInstructor], accountController.getInstructorCard, handleErrors);

    // activate instructor account
    app.patch('/instructor/account/activate', accountController.activeInstructorAccount, handleErrors);

    // send course to admin for revision
    app.post('/instructor/course/review', [auth.Jwt.verifyToken, auth.Jwt.isInstructor], courseController.sendCourseToReview, handleErrors)

};
