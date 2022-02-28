const { auth, courseExist } = require(__dirname + "/../../middlewares"),
    controllers = require(__dirname + "/controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin",
        );
        next();
    });

    app.post("/commerce/cart", [auth.Jwt.verifyToken, courseExist.cart_wishlist], controllers.addToCart);

    app.get("/commerce/cart", [auth.Jwt.verifyToken], controllers.getCart);

    app.delete("/commerce/cart", [auth.Jwt.verifyToken], controllers.deleteCart);

    // delete course from cart
    app.delete("/commerce/cart/course", [auth.Jwt.verifyToken], controllers.deleteCartCourse);


};