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

    app.post("/commerce/wishlist", [auth.Jwt.verifyToken, courseExist.cart_wishlist], controllers.addToWishlist);

    app.get("/commerce/wishlist", [auth.Jwt.verifyToken], controllers.getWishlist);

    app.delete("/commerce/wishlist", [auth.Jwt.verifyToken], controllers.deleteWishlist);

    // delete course from wishlist
    app.delete("/commerce/wishlist/course", [auth.Jwt.verifyToken], controllers.deleteWishlistCourse);

};