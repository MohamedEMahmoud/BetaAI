const auth = require(__dirname + "/../modules/auth/middlewares"),
    course = require(__dirname + "/../modules/course/middlewares"),
    compiler = require(__dirname + "/../modules/compiler/middlewares"),
    coupon = require(__dirname + "/../modules/coupon/middlewares"),
    checkout = require(__dirname + "/../modules/checkout/middlewares"),
    recruiter = require(__dirname + "/../modules/recruiter/middlewares"),
    fileValidation = require(__dirname + "/uploadFiles"),
    handleErrors = require(__dirname + "/handleErrors"),
    courseExist = require(__dirname + "/verify-cart-wishlist"),
    preValidation = require(__dirname + "/preValidation");

module.exports = {
    auth,
    fileValidation,
    compiler,
    coupon,
    handleErrors,
    recruiter,
    course,
    checkout,
    courseExist,
    preValidation,
};