const db = require(__dirname + "/../../models"),
    Coupons = db.coupon,
    moment = require("moment");

stopCouponsOlderThanFiveDays = async (req, res, next) => {
    try {
        let older_than = moment().subtract(5, 'days').toDate();
        await Coupons.updateMany({ created_at: { $lte: older_than } }, { status: false });
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

activeCouponsWithZeroTimes = async (req, res, next) => {
    try {
        await Coupons.updateMany({ times: 0 }, { status: false });
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

const verifyCoupons = {
    stopCouponsOlderThanFiveDays,
    activeCouponsWithZeroTimes
}

module.exports ={
    verifyCoupons
}