const db = require(__dirname + "/../../models"),
  Course = db.course,
  Section = db.section,
  Lecture = db.lecture,
  Payment = db.payment,
  QuizAnswer = db.quizAnswer,
  SolvedQuiz = db.solvedQuiz,
  Quiz = db.quiz,
  Rate = db.rate,
  path = require("path"),
  multer = require("multer"),
  moment = require("moment"),
  FormData = require("form-data"),
  slugify = require("slugify");
courseExist = async (req, res, next) => {
  try {

    const slugTitle = slugify(req.body.title, {
      replacement: "-",
      lower: true,
    });
    const courseExist = await Course.findOne({ slug: slugTitle });

    if (courseExist) {
      throw { status: 400, message: "Course exists", success: false };
    } else {
        next();
    }
  } catch (e) {
    console.log(e);
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

course = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.query.course }).populate([
      {
        path: "owner",
        model: "User",
        select:
          "_id name username email sex age image address phone government country level",
      },
      {
        path: "author",
        model: "User",
        select:
          "_id name username email sex age image address phone government country level",
      },
      {
        path: "sections",
        model: "Section",
        populate: [
          {
            path: "lectures",
            model: "Lecture",
            populate: [
              {
                path: "questions",
                model: "Question",
                populate: [
                  {
                    path: "student",
                    model: "User",
                    select:
                      "_id name username email sex age image address phone government country level",
                  },
                  {
                    path: "answers",
                    model: "Answer",
                    populate: {
                      path: "user",
                      model: "User",
                      select:
                        "_id name username email sex age image address phone government country level",
                    },
                  },
                ],
              },
              {
                path: "comments",
                model: "commentsLecture",
                populate: {
                  path: "student",
                  model: "User",
                  select:
                    "_id name username email sex age image address phone government country level",
                },
              },
            ],
          },
          {
            path: "quizzes",
            model: "Quiz",
            populate: {
              path: "quizItems",
              model: "quizItem",
            },
          },
        ],
      },
    ]);

    if (!course) {
      throw { status: 404, message: "Course is not Exist", success: false };
    }

    req.course = course;
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

section = async (req, res, next) => {
  try {
    const section = await Section.findOne({ slug: req.query.section }).populate(
      [
        {
          path: "sections",
          model: "Section",
          populate: [
            {
              path: "lectures",
              model: "Lecture",
              populate: [
                {
                  path: "questions",
                  model: "Question",
                  populate: [
                    {
                      path: "student",
                      model: "User",
                      select:
                        "_id name username email sex age image address phone government country level",
                    },
                    {
                      path: "answers",
                      model: "Answer",
                      populate: {
                        path: "user",
                        model: "User",
                        select:
                          "_id name username email sex age image address phone government country level",
                      },
                    },
                  ],
                },
                {
                  path: "comments",
                  model: "commentsLecture",
                  populate: {
                    path: "student",
                    model: "User",
                    select:
                      "_id name username email sex age image address phone government country level",
                  },
                },
              ],
            },
            {
              path: "quizzes",
              model: "Quiz",
              populate: {
                path: "quizItems",
                model: "quizItem",
              },
            },
          ],
        },
      ]
    );

    if (!section) {
      throw { status: 404, message: "section is not Exist", success: false };
    }

    req.section = section;
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

lecture = async (req, res, next) => {
  try {
    const lecture = await Lecture.findOne({ slug: req.query.lecture }).populate(
      [
        {
          path: "lectures",
          model: "Lecture",
          populate: [
            {
              path: "questions",
              model: "Question",
              populate: [
                {
                  path: "student",
                  model: "User",
                  select:
                    "_id name username email sex age image address phone government country level",
                },
                {
                  path: "answers",
                  model: "Answer",
                  populate: {
                    path: "user",
                    model: "User",
                    select:
                      "_id name username email sex age image address phone government country level",
                  },
                },
              ],
            },
            {
              path: "comments",
              model: "commentsLecture",
              populate: {
                path: "student",
                model: "User",
                select:
                  "_id name username email sex age image address phone government country level",
              },
            },
          ],
        },
      ]
    );

    if (!lecture) {
      throw { status: 404, message: "lecture is not Exist", success: false };
    }

    req.lecture = lecture;
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

calcEndIn_Course = async (req, res, next) => {
  try {
    const end_in = moment().add(process.env.COURSE_PERIOD, "months").format();

    req.end_in = end_in;

    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

endIn_Course = async (req, res, next) => {
  try {
    const courses = await Payment.find({
      buyer: req.user._id,
      stillOpen: true,
      price: { $gt: 0 },
      type: "course",
    });
    if (courses) {
      courses.map(async (course) => {
        if (
          course &&
          course.end_in &&
          (course.end_in === new Date() || new Date() > course.end_in)
        ) {
          course.stillOpen = false;
          await course.save();
        }
      });
    }
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

published = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      slug: req.query.slug,
      review: true,
      published: true,
    });

    if (course) {
      return res.send({
        status: 200,
        message: "Modification prevented for published courses",
        success: true,
      });
    }
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

checkForUpdateCourse = async (req, res, next) => {
  try {
    if (req.body.name) {
      const slugName = slugify(req.body.name, {
        replacement: "-",
        lower: true,
      });
      if (req.body.name && req.course.slug === slugName) {
        throw {
          status: 409,
          message: `${req.body.name} already exists`,
          success: false,
        };
      }
    }
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

checkForUpdateSection = async (req, res, next) => {
  try {
    const slugTitle = slugify(req.body.title, {
      replacement: "-",
      lower: true,
    });
    if (req.body.title && req.section.slug === slugTitle) {
      throw {
        status: 409,
        message: `${req.body.title} section exists`,
        success: false,
      };
    }
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

checkForUpdateLecture = async (req, res, next) => {
  try {
    const slugName = slugify(req.body.name, { replacement: "-", lower: true });
    if (req.body.name && req.lecture.slug === slugName) {
      throw {
        status: 409,
        message: `${req.body.name} lecture exists`,
        success: false,
      };
    }
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

validateQuestionNotAnswered = async (req, res, next) => {
  try {
    const validateAnswer = await QuizAnswer.findOne({
      quest: req.query.question,
    });

    if (validateAnswer) {
      throw {
        status: 409,
        message: "You have already answered this question before.",
        success: false,
      };
    }
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

getStudentScore = async (req, res, next) => {
  try {
    const questions = await Quiz.findOne({ _id: req.query.quiz }).populate(
      "quizItems",
      "_id degree"
    );
    const answers = await QuizAnswer.find({
      quest: { $in: questions.quizItems },
    });

    if (questions.quizItems.length === answers.length) {
      // calc total score
      let totalScore = 0;
      let score = 0;
      for (let i = 0; i < questions.quizItems.length; i++) {
        totalScore += questions.quizItems[i].degree;
      }

      for (let i = 0; i < answers.length; i++) {
        if (answers[i].valid) {
          questions.quizItems.map(async (item) => {
            if (answers[i].quest.equals(item._id)) {
              score += item.degree;
            }
          });
        }
      }

      let result = await SolvedQuiz.findOne({ quiz: req.query.quiz }).populate([
        {
          path: "student",
          model: "User",
          select:
            "_id name username email sex age image address phone government country level",
        },
        {
          path: "quiz",
          model: "Quiz",
          populate: {
            path: "quizItems",
            model: "quizItem",
          },
        },
      ]);

      if (!result) {
        const markQuizAsFinished = await new SolvedQuiz({
          quiz: req.query.quiz,
          score: (score / totalScore) * 100,
          student: req.user._id,
        });
        await markQuizAsFinished.save();

        result = await SolvedQuiz.findOne({
          _id: markQuizAsFinished._id,
        }).populate([
          {
            path: "student",
            model: "User",
            select: "_id name username email age image",
          },
          {
            path: "quiz",
            model: "Quiz",
            populate: {
              path: "quizItems",
              model: "quizItem",
            },
          },
        ]);
      }
      req.result = result;
      next();
    }
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

_course = async (req, res, next) => {
  try {
    const courses = await Course.find();
    const rates = await Rate.find({
      course: { $in: courses.map((course) => course._id) },
      type: "course",
    });

    await courses.map(async (course) => {
      let stars = 0;
      await rates.map(async (r) => {
        if (r.course.equals(course._id)) {
          stars += r.rate;
        }
        let courseTotalRate = stars / rates.length;
        if (courseTotalRate > 0) {
          course.rating = courseTotalRate.toFixed(1);
        }
      });
      await course.save();
    });
    req.courses = courses;
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

_lecture = async (req, res, next) => {
  try {
    const lecture = await Lecture.findOne({ slug: req.query.lecture });
    const rates = await Rate.find({ lecture: lecture._id, type: "lecture" });

    let stars = 0;

    await rates.map(async (r) => {
      if (r.lecture.equals(lecture._id)) {
        stars += r.rate;
      }

      let lectureTotalRate = stars / rates.length;

      if (lectureTotalRate > 0) {
        lecture.rating = lectureTotalRate.toFixed(1);
      }
    });
    await lecture.save();
    req.lecture = lecture;
    next();
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};
const verifyExist = {
  courseExist,
};
const find = {
  course,
  section,
  lecture,
};

const verifyCourse = {
  calcEndIn_Course,
  endIn_Course,
  published,
};

const verifyUpdate = {
  checkForUpdateCourse,
  checkForUpdateSection,
  checkForUpdateLecture,
};

const quizValidation = {
  validateQuestionNotAnswered,
  getStudentScore,
};

const rate = {
  _course,
  _lecture,
};

module.exports = {
  verifyExist,
  find,
  verifyCourse,
  verifyUpdate,
  quizValidation,
  rate,
};
