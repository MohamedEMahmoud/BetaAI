const { auth, recruiter, handleErrors, fileValidation, preValidation } = require(__dirname + "/../../middlewares"),
    controller = require(__dirname + "/controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin",
        );
        next();
    });

    app.post("/recruiter/job", [auth.Jwt.verifyToken, auth.Jwt.isRecruiter, recruiter.verifyJobs.stopJobsOlderThanFiveDays, fileValidation.upload.none(), preValidation.create_Job_Category_Skills, preValidation.Job_Category_Skills_Message], controller.createJob, handleErrors);

    app.patch("/recruiter/job/application", [auth.Jwt.verifyToken, recruiter.verifyJobs.stopJobsOlderThanFiveDays, auth.Jwt.isRecruiter, fileValidation.upload.none(), preValidation.Job_Category_Skills_Message],
        controller.updateApplicationStatus,
        handleErrors
    );
};