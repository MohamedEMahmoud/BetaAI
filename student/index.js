const { auth, course, recruiter, handleErrors, fileValidation, preValidation } = require(__dirname + "/../../middlewares"),
    controller = require(__dirname + "/controller"),
    complaintController = require(__dirname + "/../admin/controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin"
        );
        next();
    });

    // apply for specific job
    app.post("/job/apply", [auth.Jwt.verifyToken, recruiter.verifyJobs.stopJobsOlderThanFiveDays, fileValidation.upload.fields([{
        name: 'cv',
        maxCount: 1
    }]),
    preValidation.createJobApplication,
    preValidation.jobApplicationMessage,
    fileValidation.validateApplicantCV,
    ],
        controller.applyJob,
        handleErrors
    );

    // update job application after applying
    app.patch("/job/application",
        [auth.Jwt.verifyToken, recruiter.verifyJobs.stopJobsOlderThanFiveDays,
        fileValidation.upload.fields([{
            name: 'cv',
            maxCount: 1
        }]),
        preValidation.jobApplicationMessage,
        fileValidation.validateApplicantCV
        ],
        controller.updateApplication,
        handleErrors
    );

    app.post("/help", [auth.Jwt.verifyToken, fileValidation.upload.fields([{
        name: "image",
        maxCount: 1
    }])], controller.createComplaint, handleErrors);

    //course in single page
    app.get('/course', controller.singleCourse);

    //get all courses
    app.get('/courses', controller.courses)

    //get all labs
    app.get('/labs', controller.labs)

    //get card data for users Or instructor
    app.get('/card', [auth.Jwt.verifyToken], controller.getUserCard);

    app.post("/complaint", [auth.Jwt.verifyToken, fileValidation.upload.none()], complaintController.showUsersComplaint, handleErrors);

    //get all courses users buys
    app.get('/learning/courses', [auth.Jwt.verifyToken, course.verifyCourse.endIn_Course], controller.saleCourses)

    //get a single page from courses users buys
    // app.get('/learning/course', [auth.Jwt.verifyToken], controller.saleSingleCourse)

    // GET lecture
    app.get('/course/section/lecture', [auth.Jwt.verifyToken], controller.getLecture, handleErrors);

    // add note
    app.post('/note', [auth.Jwt.verifyToken, fileValidation.upload.none(), preValidation.createLectureNote], controller.addNote)

    // qustions show in disscustion
    app.post('/question',
        [auth.Jwt.verifyToken,
        fileValidation.upload.fields([{ name: 'image', maxCount: 1 }]),
        preValidation.createQuestion,
        fileValidation.validationPhoto],
        controller.question,
        handleErrors
    );

    // update question
    app.patch('/question',
        [auth.Jwt.verifyToken,
        fileValidation.upload.fields([{ name: 'image', maxCount: 1 }]),
        fileValidation.validationPhoto],
        controller.updateQuestion,
        handleErrors
    );

    // answer qustions
    app.post('/answer',
        [auth.Jwt.verifyToken,
        fileValidation.upload.fields([{ name: 'image', maxCount: 1 }]),
        preValidation.createAnswer,
        fileValidation.validationPhoto],
        controller.answer,
        handleErrors
    );

    // update answer
    app.patch('/answer',
        [auth.Jwt.verifyToken,
        fileValidation.upload.fields([{ name: 'image', maxCount: 1 }]),
        fileValidation.validationPhoto],
        controller.updateAnswer,
        handleErrors
    );

    //student answer on quiz
    app.post('/quiz/answer',
        [auth.Jwt.verifyToken, course.quizValidation.getStudentScore,
        course.quizValidation.validateQuestionNotAnswered, fileValidation.upload.none()],
        controller.studentAnswer, handleErrors);

    // create comment courses 
    app.post('/comment', [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.comment);

    // update comment
    app.patch('/comment', [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.updateComment);

    // create rate courses  
    app.post('/rate', [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.rate);
    
    // active window 
    app.get('/active/window', controller.activeWindowPro);


};