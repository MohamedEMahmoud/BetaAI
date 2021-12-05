const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.course = require("./course.model");
db.section = require("./section.model");
db.lecture = require("./lecture.model");
db.coupon = require("./coupon.model");
db.cart = require("./cart.model");
db.wishlist = require("./wishlist.model");
db.payment = require("./payment.model");
db.cardUser = require('./card.user.model');
db.cardInstructor = require('./card.instructor.model');
db.account = require('./account.model');
db.job = require('./job.model');
db.job_application = require('./job_application.model');
db.job_categories = require('./job_categories.model');
db.skills = require('./skills.model');
db.notification = require('./notification.model');
db.complaint = require('./complaint.model');
db.bestseller = require('./bestseller.model');
db.commentsCourse = require('./comment.course.model');
db.commentsLecture = require('./comment.lecture.model');
db.rate = require('./rate.model');
db.note = require('./note.model');
db.question = require('./question.model');
db.answer = require('./answer.model');
db.quiz = require('./quiz.model');
db.quizItem = require('./quiz.item.model');
db.quizAnswer = require('./quiz.answer.model');
db.solvedQuiz = require('./solvedQuiz.model');
db.domain = require('./domain.model');
db.plan = require('./plan.model');
db.feature = require('./feature.model');
db.watch = require('./watch.model');
db.certificate = require('./certificate.model');
db.sale = require('./sales.model');
db.chat = require('./chat.model');
db.message = require('./message.model');

db.ROLES = ["user", "admin", "instructor", "recruiter", "super"];

module.exports = db;