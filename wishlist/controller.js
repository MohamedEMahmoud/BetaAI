const db = require(__dirname + "/../../models"),
    Course = db.course,
    Wishlist = db.wishlist,
    Logger = require(__dirname + "/../../services/loggers.services"),
    logger = new Logger('wishlist');

exports.addToWishlist = async (req, res) => {
    try {
        let wishlist;

        const course = await Course.findOne({ slug: req.query.course });

        const buyerExist = await Wishlist.findOne({ buyer: req.user._id })

        if (buyerExist) {
            wishlist = await Wishlist.findOneAndUpdate({ buyer: req.user._id }, { $addToSet: { courses: course._id }, $inc: { total: course.price, totalDiscount: course.old_price } }, { new: true });
        }

        if (!buyerExist) {
            wishlist = await new Wishlist({ courses: [course._id], buyer: req.user._id, total: course.price, totalDiscount: course.old_price });
            await wishlist.save();
        }

        wishlist = await Wishlist.find({ buyer: req.user._id }).populate("courses", "_id name price image slug")

        logger.info('wishlist Data', { user: req.user, wishlist });

        res.status(200).send({ status: 200, wishlist, success: true })

    } catch (e) {
        console.log(e)
        res.status(e.status || 400).send({
            status: e.status || 400,
            message: e.message || "Unknown server error",
            success: false
        });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ buyer: req.user._id })
            .populate({
                path: 'courses',
                model: 'Course',
                select: '_id name price image slug old_price',
                populate: {
                    path: 'owner',
                    model: 'User',
                    select: '_id name username email sex age image address phone government country level',
                }
            })
        if (!wishlist) {
            return res.status(200).send({ status: 200, wishlist: {}, success: true });
        }

        res.status(200).send({ status: 200, wishlist, success: true });
    } catch (e) {
        res.status(400).send({ status: 400, message: e.message || "Unknown server error", success: false });
    }
}

exports.deleteWishlist = async (req, res) => {
    try {

        await Wishlist.findByIdAndDelete({ _id: req.query.wishlistId })

        res.status(204).send();
    } catch (e) {
        res.status(e.status || 400).send({
            status: e.status || 400,
            message: e.message || "Unknown server error",
            success: false
        });
    }
}

exports.deleteWishlistCourse = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course });

        const existingCourse = await Wishlist.findOne({ buyer: req.user._id });

        if (course && existingCourse.courses.includes(course._id)) {

            if (existingCourse.courses.length === 1) {

                await existingCourse.remove();

                res.status(200).send({ status: 200, wishlist: {}, success: true });

            } else {

                const wishlist = await Wishlist.findOneAndUpdate({ buyer: req.user._id }, {
                    $inc: { total: -course.price, totalDiscount: -course.old_price },
                    $pull: { courses: course._id }
                }, { new: true })
                    .populate("courses", "_id name price image slug");

                await wishlist.save();

                res.status(200).send({ status: 200, wishlist, success: true });
            }
        } else {
            res.status(404).send({ status: 404, message: "Course does not exists", success: false });
        }

    } catch (e) {
        res.status(e.status || 400).send({
            status: e.status || 400,
            message: e.message || "Unknown server error",
            success: false
        });
    }
}