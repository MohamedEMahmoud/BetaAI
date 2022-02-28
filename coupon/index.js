const { auth, coupon, fileValidation, preValidation } = require(__dirname + "/../../middlewares"),
    couponControllers = require(__dirname + "/controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin"
        );
        next();
    });

    app.post('/commerce/coupon', [auth.Jwt.verifyToken, auth.Jwt.isInstructor, fileValidation.upload.none(), preValidation.createCoupon], couponControllers.generateCoupon);

    app.get('/commerce/coupon', [auth.Jwt.verifyToken, coupon.verifyCoupons.stopCouponsOlderThanFiveDays, coupon.verifyCoupons.activeCouponsWithZeroTimes], couponControllers.getInstructorCoupons);

    app.get('/commerce/coupon/validate', [auth.Jwt.verifyToken, coupon.verifyCoupons.stopCouponsOlderThanFiveDays, coupon.verifyCoupons.activeCouponsWithZeroTimes], couponControllers.validateCoupon);

    // todo: enable Py-shell to work as emergency compiler
    // app.post("/compiler/py-shell", [auth.Jwt.verifyToken, fileValidation.upload.none()], pyShellCompiler)

}