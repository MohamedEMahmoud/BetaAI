const { auth, coupon, handleErrors, fileValidation, preValidation } = require(__dirname + "/../../middlewares"),
    controller = require(__dirname + "/controller"),
    couponControllers = require(__dirname + "/../coupon/controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin",
        );
        next();
    });

    app.post("/admin/role", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.addNewRole, handleErrors);

    app.post("/admin/update-role", [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.updatePermissions);

    app.post("/admin/category", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.createCategory, handleErrors);

    app.get("/admin/category", [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.getCategories, handleErrors);

    app.post("/admin/skill", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.createSkill, handleErrors);

    app.get("/admin/skill", [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.getSkills, handleErrors);

    app.get("/admin/coupon",
        [auth.Jwt.verifyToken, coupon.verifyCoupons.stopCouponsOlderThanFiveDays, coupon.verifyCoupons.activeCouponsWithZeroTimes, auth.Jwt.isAdmin, fileValidation.upload.none()],
        couponControllers.getAllCoupons
    );

    app.post("/admin/promotion",
        [auth.Jwt.verifyToken, coupon.verifyCoupons.stopCouponsOlderThanFiveDays, coupon.verifyCoupons.activeCouponsWithZeroTimes, auth.Jwt.isAdmin, fileValidation.upload.none()],
        couponControllers.sendPromotionEmail
    );

    // create complaint routers
    app.post("/admin/complaint", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.showAllComplaints, handleErrors);

    app.post("/admin/complaint/select", [auth.Jwt.verifyToken, fileValidation.upload.none(), auth.Jwt.isAdmin], controller.assignComplaintToSpecificAdmin, handleErrors);

    app.post("/complaint/status", [auth.Jwt.verifyToken, fileValidation.upload.none()], controller.changeComplaintStatus, handleErrors);

    // get courses that marked as 'review' to be reviewed
    app.get('/admin/courses', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.getCoursesNeedsReview, handleErrors)

    // publish reviewed course
    app.patch('/admin/course/publish', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.publishCourse, handleErrors)

    // send course back to instructor to fix problems
    app.patch('/admin/return/course', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none()], controller.sendCourseBackToInstructor, handleErrors)

    // add domain
    app.post('/admin/domain', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none(), preValidation.createDomain], controller.addDomain, handleErrors)

    //update domain
    app.patch('/admin/domain', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none()], controller.updateDomain, handleErrors)

    // remove domain
    app.delete('/admin/domain', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.removeDomain, handleErrors)

    // get all domain
    app.get('/admin/domain', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.getAllDomain, handleErrors)

    // add plan
    app.post('/admin/plan', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none(), preValidation.createPlan], controller.addPlan, handleErrors)

    //update plan
    app.patch('/admin/plan', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none()], controller.updatePlan, handleErrors)

    // remove plan
    app.delete('/admin/plan', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.removePlan, handleErrors)

    // get all plan
    app.get('/plan', controller.getAllPlan, handleErrors)

    // create feature
    app.post('/admin/plan/feature',
        [auth.Jwt.verifyToken, auth.Jwt.isAdmin,
        fileValidation.upload.fields([{ name: 'description' }]),
        fileValidation.validationVideo, preValidation.createFeature,],
        controller.createFeature, handleErrors)

    // update feature
    app.patch('/admin/plan/feature',
        [auth.Jwt.verifyToken, auth.Jwt.isAdmin,
        fileValidation.upload.fields([{ name: 'description' }]),
        fileValidation.validationVideo],
        controller.updateFeature, handleErrors)

    // remove feature
    app.delete('/admin/plan/feature', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.removeFeature, handleErrors)

    // Ban
    app.patch('/admin/ban', [auth.Jwt.verifyToken, auth.Jwt.isAdmin, fileValidation.upload.none(), preValidation.ban], controller.ban, handleErrors);

    // get admin data from log file
    app.get('/admin/log/admin', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get auth data from log file
    app.get('/admin/log/auth', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get cart data from log file
    // app.get('/admin/log/cart', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get checkout data from log file
    app.get('/admin/log/checkout', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get coupon data from log file
    app.get('/admin/log/coupon', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get course data from log file
    app.get('/admin/log/course', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get instructor data from log file
    app.get('/admin/log/instructor', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get notification data from log file
    app.get('/admin/log/notification', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get recruiter data from log file
    app.get('/admin/log/recruiter', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get super data from log file
    app.get('/admin/log/super', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get user data from log file
    app.get('/admin/log/user', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // get wishlist data from log file
    app.get('/admin/log/wishlist', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.readFile, handleErrors);

    // delete data from admin.log
    app.delete('/admin/log/admin', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from auth.log
    app.delete('/admin/log/auth', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from cart.log
    // app.delete('/admin/log/cart', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from checkout.log
    app.delete('/admin/log/checkout', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from coupon.log
    app.delete('/admin/log/coupon', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from course.log
    app.delete('/admin/log/course', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from instructor.log
    app.delete('/admin/log/instructor', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from notification.log
    app.delete('/admin/log/notification', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from recruiter.log
    app.delete('/admin/log/recruiter', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from super.log
    app.delete('/admin/log/super', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from user.log
    app.delete('/admin/log/user', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

    // delete data from wishlist.log
    app.delete('/admin/log/wishlist', [auth.Jwt.verifyToken, auth.Jwt.isAdmin], controller.deleteSelectLine, handleErrors);

};