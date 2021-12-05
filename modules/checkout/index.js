const { auth, checkout, course, fileValidation, handleErrors, preValidation } = require(__dirname + "/../../middlewares"),
    checkoutPlanController = require(__dirname + "/checkout.plan.controller"),
    checkoutCourseController = require(__dirname + "/checkout.course.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin",
        );
        next();
    });

    // checkout course
    app.post("/commerce/checkout",
        [auth.Jwt.verifyToken, fileValidation.upload.none(), preValidation.createCreditCard, checkout.verifyDomain.endIn_Domain, course.verifyCourse.calcEndIn_Course, checkout.sales.instructor],
        checkoutCourseController.checkoutMechanism, handleErrors);

    // checkout plan
    app.post('/commerce/plan', [auth.Jwt.verifyToken, fileValidation.upload.none(), preValidation.createCreditCard, checkout.verifyPlan.calcEndIn_Plan], checkoutPlanController.checkoutPlan, handleErrors);
};
