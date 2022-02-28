const db = require(__dirname + "/../../models"),
    User = db.user;

activation = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user.active) {
            throw { status: 400, message: "Please Activation your email to login", success: false };
        }
        next()
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}
const account = {
    activation
}

module.exports = {
    account
}