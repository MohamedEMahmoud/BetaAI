const { auth, handleErrors, verifyCoupons, fileValidation, preValidation } = require(__dirname + "/../../middlewares"),
    controller = require(__dirname + "/../admin/controller"),
    couponControllers = require(__dirname + "/../coupon/controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin",
        );
        next();
    });

    // app.post("/admin/role", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.addNewRole, handleErrors);

    // app.post("/admin/update-role", [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.updatePermissions);

    // app.post("/admin/category", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.createCategory, handleErrors);

    // app.get("/admin/category", [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.getCategories, handleErrors);

    // app.post("/admin/skill", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.createSkill, handleErrors);

    // app.get("/admin/skill", [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.getSkills, handleErrors);

    // app.get("/admin/coupon",
    //     [auth.Jwt.verifyToken, verifyCoupons.stopCouponsOlderThanFiveDays, verifyCoupons.activeCouponsWithZeroTimes, auth.Jwt.isAdmin, fileValidation.upload.none()],
    //     couponControllers.getAllCoupons
    // );

    // app.post("/admin/promotion",
    //     [auth.Jwt.verifyToken, verifyCoupons.stopCouponsOlderThanFiveDays, verifyCoupons.activeCouponsWithZeroTimes, auth.Jwt.isAdmin, fileValidation.upload.none()],
    //     couponControllers.sendPromotionEmail
    // );

    // // create complaint routers
    // app.post("/admin/complaint", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.showAllComplaints, handleErrors);

    // app.post("/admin/complaint/select", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.assignComplaintToSpecificAdmin, handleErrors);

    // app.post("/complaint/status", [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.changeComplaintStatus, handleErrors);

    // // get courses that marked as 'review' to be reviewed
    // app.get('/admin/courses', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.getCoursesNeedsReview, handleErrors)

    // // publish reviewed course
    // app.patch('/admin/course/publish', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.publishCourse, handleErrors)

    // // send course back to instructor to fix problems
    // app.patch('/admin/return/course', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none()], controller.sendCourseBackToInstructor, handleErrors)

    // // add domain
    // app.post('/admin/domain', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none(), preValidation.createDomain], controller.addDomain, handleErrors)

    // //update domain
    // app.patch('/admin/domain', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none()], controller.updateDomain, handleErrors)

    // // remove domain
    // app.delete('/admin/domain', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.removeDomain, handleErrors)

    // // get all domain
    // app.get('/admin/domain', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.getAllDomain, handleErrors)

    // // add plan
    // app.post('/admin/plan', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none(), preValidation.createPlan], controller.addPlan, handleErrors)

    // //update plan
    // app.patch('/admin/plan', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none()], controller.updatePlan, handleErrors)

    // // remove plan
    // app.delete('/admin/plan', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.removePlan, handleErrors)

    // // get all plan
    // app.get('/plan', controller.getAllPlan, handleErrors)

    // // create feature
    // app.post('/admin/plan/feature',
    //     [auth.Jwt.verifyToken, auth.Jwt.isAdmin,
    //     fileValidation.upload.fields([{ name: 'description' }]),
    //     fileValidation.validationVideo, preValidation.createFeature,],
    //     controller.createFeature, handleErrors)

    // // update feature
    // app.patch('/admin/plan/feature',
    //     [auth.Jwt.verifyToken, auth.Jwt.isAdmin,
    //     fileValidation.upload.fields([{ name: 'description' }]),
    //     fileValidation.validationVideo],
    //     controller.updateFeature, handleErrors)

    // // remove feature
    // app.delete('/admin/plan/feature', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.removeFeature, handleErrors)

    // // Ban
    // app.patch('/admin/ban',
    //     [auth.Jwt.verifyToken, auth.Jwt.isAdmin,
    //     fileValidation.upload.none(),
    //     preValidation.ban,
    //     ],
    //     controller.ban, handleErrors)
};