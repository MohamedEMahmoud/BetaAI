const { auth, fileValidation, } = require(__dirname + "/../../middlewares"),
    controller = require(__dirname + "/controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin",
        );
        next();
    });

    app.get('/chat', [auth.Jwt.verifyToken], controller.getAllChats);

    app.post('/search', [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.search);

    app.patch('/chat/student', [auth.Jwt.verifyToken], controller.addInstructorAsFriendToStudentAndOpposite)

}


