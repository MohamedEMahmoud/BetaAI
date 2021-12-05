const db = require(__dirname + "/../models"),
    Course = db.course,
    Wishlist = db.wishlist,
    Cart = db.cart;

cart_wishlist = async (req, res, next) => {
    try {

        const course = await Course.findOne({ slug: req.query.course });

        const CourseExistInCart = await Cart.findOne({ buyer: req.user._id, courses: course._id });

        const CourseExistInWishlist = await Wishlist.findOne({ buyer: req.user._id, courses: course._id });

        if (CourseExistInCart && CourseExistInCart.courses.length === 1) {
            await CourseExistInCart.remove();
        }

        if (CourseExistInCart && CourseExistInCart.courses.length > 1) {
            CourseExistInCart.courses = CourseExistInCart.courses.filter(c => !c.equals(course._id))
            CourseExistInCart.total -= course.price;
            CourseExistInCart.totalDiscount -= course.old_price;
            await CourseExistInCart.save();
        }

        if (CourseExistInWishlist && CourseExistInWishlist.courses.length === 1) {
            await CourseExistInWishlist.remove();
        }

        if (CourseExistInWishlist && CourseExistInWishlist.courses.length > 1) {
            CourseExistInWishlist.courses = CourseExistInWishlist.courses.filter(c => !c.equals(course._id))
            CourseExistInWishlist.total -= course.price;
            CourseExistInWishlist.totalDiscount -= course.old_price;
            await CourseExistInWishlist.save();

        }

        next();


    } catch (e) {
        return res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

module.exports = {
    cart_wishlist
}