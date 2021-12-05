const {
    auth,
    course,
    handleErrors,
    preValidation,
    fileValidation,
  } = require(__dirname + "/../../middlewares"),
  courseControllers = require(__dirname + "/course.controller"),
  sectionControllers = require(__dirname + "/section.controller"),
  quizControllers = require(__dirname + "/quiz.controller"),
  lectureControllers = require(__dirname + "/lecture.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin"
    );
    next();
  });

  //create course
  app.post(
    "/course",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.fields([
        { name: "image", maxCount: 1 },
        { name: "preview_course", maxCount: 1 },
      ]),
      course.verifyExist.courseExist,
      preValidation.createCourse,
      preValidation.courseMessage,
      fileValidation.validationPhoto,
      // fileValidation.validationVideo,
    ],
    courseControllers.createCourse,
    handleErrors
  );

  //update Course
  app.patch(
    "/course",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.fields([
        { name: "image", maxCount: 1 },
        { name: "preview_course", maxCount: 1 },
      ]),
      preValidation.courseMessage,
      fileValidation.validationPhoto,
      fileValidation.validationVideo,
      course.find.course,
      course.verifyUpdate.checkForUpdateCourse,
    ],
    courseControllers.updateCourse
  );

  // course details for ownerInstructor
  app.get(
    "/course/instructor",
    [auth.Jwt.verifyToken, auth.Jwt.isInstructor],
    course.find.course,
    courseControllers.singleCourse,
    handleErrors
  );

  // get all instructor related courses
  app.get(
    "/courses/instructor",
    [auth.Jwt.verifyToken, auth.Jwt.isInstructor],
    courseControllers.allInstructorCourses,
    handleErrors
  );

  // create section with query courseId
  app.post(
    "/course/section",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.none(),
      preValidation.createSection,
    ],
    sectionControllers.createSection,
    handleErrors
  );

  // update section
  app.patch(
    "/course/section",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.none(),
      course.find.section,
      course.verifyCourse.published,
      course.verifyUpdate.checkForUpdateSection,
    ],
    sectionControllers.updateSection,
    handleErrors
  );

  //remove section with query courseId
  app.delete(
    "/course/section",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      course.find.section,
      course.verifyCourse.published,
    ],
    sectionControllers.removeSection,
    handleErrors
  );

  // create lecture
  app.post(
    "/course/section/lecture",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.fields([
        { name: "media", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
        { name: "preview_lecture", maxCount: 1 },
        { name: "lecture_video", maxCount: 1 },
      ]),
      preValidation.createLecture,
      fileValidation.validationPhoto,
      fileValidation.validationVideo,
      fileValidation.validationMedia,
    ],
    lectureControllers.createLecture,
    handleErrors
  );

  // update lecture
  app.patch(
    "/course/section/lecture",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.fields([
        { name: "media", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
        { name: "preview_lecture", maxCount: 1 },
        { name: "lecture_video", maxCount: 1 },
      ]),
      fileValidation.validationPhoto,
      fileValidation.validationVideo,
      fileValidation.validationMedia,
      course.find.lecture,
      course.verifyUpdate.checkForUpdateLecture,
    ],
    lectureControllers.updateLecture,
    handleErrors
  );

  // create lecture rate
  app.post(
    "/course/section/lecture/rate",
    [auth.Jwt.verifyToken, fileValidation.upload.none()],
    lectureControllers.lectureRate
  );

  // get all rate lecture
  app.get(
    "/course/section/lecture/rate",
    [course.rate._lecture],
    lectureControllers.getLectureRate,
    handleErrors
  );

  // create lecture comment
  app.post(
    "/course/section/lecture/comment",
    [auth.Jwt.verifyToken, course.find.lecture, fileValidation.upload.none()],
    lectureControllers.lectureComment
  );

  // get all comment lecture
  app.get(
    "/course/section/lecture/comment",
    [course.find.lecture],
    lectureControllers.getLectureComment
  );

  // update lecture with query sectionId
  app.delete(
    "/course/section/lecture",
    [auth.Jwt.verifyToken, auth.Jwt.isInstructor, course.find.lecture],
    lectureControllers.removeLecture,
    handleErrors
  );

  // create quiz in section
  app.post(
    "/course/quiz",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.none(),
      preValidation.createQuize,
      course.find.section,
    ],
    quizControllers.createQuiz,
    handleErrors
  );

  // update quiz
  app.patch(
    "/course/quiz",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.none(),
      course.find.section,
    ],
    quizControllers.updateQuiz,
    handleErrors
  );

  // remove quiz
  app.delete(
    "/course/quiz",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.none(),
      course.find.section,
    ],
    quizControllers.removeQuiz,
    handleErrors
  );

  // create quizItem
  app.post(
    "/course/quiz/question",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.fields([{ name: "image", maxCount: 1 }]),
      preValidation.createQuizeItem,
      course.find.section,
      fileValidation.validationPhoto,
    ],
    quizControllers.createQuizItem,
    handleErrors
  );

  // update quizItem
  app.patch(
    "/course/quiz/question",
    [
      auth.Jwt.verifyToken,
      auth.Jwt.isInstructor,
      fileValidation.upload.fields([{ name: "image", maxCount: 1 }]),
      course.find.section,
      fileValidation.validationPhoto,
    ],
    quizControllers.updateQuizItem,
    handleErrors
  );

  // delete quizItem
  app.delete(
    "/course/quiz/question",
    [auth.Jwt.verifyToken, auth.Jwt.isInstructor],
    course.find.section,
    quizControllers.removeQuizItem,
    handleErrors
  );

  //get student score
  app.post(
    "/course/quiz/score",
    [auth.Jwt.verifyToken, course.quizValidation.getStudentScore],
    quizControllers.calcStudentScore,
    handleErrors
  );

  // create course certificate to student
  app.post(
    "/course/certificate",
    [auth.Jwt.verifyToken],
    courseControllers.courseCertificate,
    handleErrors
  );

  // get student certificates
  app.get(
    "/course/student/certificates",
    [auth.Jwt.verifyToken],
    courseControllers.getStudentCertificates,
    handleErrors
  );

  //get questions for every course
  app.get(
    "/course/comments",
    courseControllers.getCourseComments,
    handleErrors
  );

  //get rate course
  app.get(
    "/course/rate",
    [course.rate._course],
    courseControllers.getCoursesRate,
    handleErrors
  );

  //search course
  app.get("/course/search", courseControllers.searchCourse, handleErrors);

  // watch course
  app.post(
    "/course/lecture/watch",
    [auth.Jwt.verifyToken],
    lectureControllers.watchLecture,
    handleErrors
  );

  //get courses path
  app.get("/course/path", courseControllers.coursesPath);
};
