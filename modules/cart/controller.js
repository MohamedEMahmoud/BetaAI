const db = require(__dirname + "/../../models"),
    Course = db.course,
    Cart = db.cart,
    Logger = require(__dirname + "/../../services/loggers.services"),
    logger = new Logger('cart');

exports.addToCart = async (req, res) => {
    try {
        let cart;

        const course = await Course.findOne({ slug: req.query.course });

        const buyerExist = await Cart.findOne({ buyer: req.user._id });

        if (buyerExist) {
            cart = await Cart.findOneAndUpdate({ buyer: req.user._id }, { $addToSet: { courses: course._id }, $inc: { total: course.price, totalDiscount: course.old_price } }, { new: true });
        }

        if (!buyerExist) {
            cart = await new Cart({ courses: [course._id], buyer: req.user._id, total: course.price, totalDiscount: course.old_price });

            await cart.save();
        }

        cart = await Cart.find({ buyer: req.user._id }).populate("courses", "_id name price image slug");

        logger.info('Cart Data', {
            req: {
                method: req.method,
                path: req.originalUrl,
                body: req.body,
                query: req.query,
                user: req.user,
            },
            cart,
            status: res.statusCode,
            success: true
        });

        res.status(200).send({ status: 200, cart, success: true });

    } catch (e) {
        res.status(e.status || 400).send({
            status: e.status || 400,
            message: e.message || "Unknown server error",
            success: false
        });
    }
};

exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ buyer: req.user._id })
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

        if (!cart) {
            return res.status(200).send({ status: 200, cart: {}, success: true });
        }

        await (cart.courses || []).map(async course => {
            const c = await Course.findOne({ _id: course._id }).populate("owner", "name email username");
            await { ...course, owner: c.owner[0] };
        })
        res.status(200).send({ status: 200, cart, success: true });
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.deleteCart = async (req, res) => {
    try {

        await Cart.findByIdAndDelete({ _id: req.query.cartId })

        res.status(204).send();
    } catch (e) {
        res.status(e.status || 400).send({
            status: e.status || 400,
            message: e.message || "Unknown server error",
            success: false
        });
    }
}

exports.deleteCartCourse = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.query.course });

        const existingCourse = await Cart.findOne({ buyer: req.user._id });

        if (existingCourse.courses.includes(course._id)) {
            if (existingCourse.courses.length === 1) {

                await existingCourse.remove();

                res.status(200).send({ status: 200, cart: {}, success: true });
            } else {

                const cart = await Cart.findOneAndUpdate({ buyer: req.user._id }, {
                    $inc: { total: -course.price, totalDiscount: -course.old_price },
                    $pull: { courses: course._id }
                }, { new: true })
                    .populate("courses", "_id name price image slug");

                await cart.save();

                res.status(200).send({ status: 200, cart, success: true });
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