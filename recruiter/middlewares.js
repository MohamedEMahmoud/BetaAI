const db = require(__dirname + "/../../models"),
    Jobs = db.job,
    moment = require("moment");

stopJobsOlderThanFiveDays = async (req, res, next) => {
    try {
        let older_than = moment().subtract(5, 'days').toDate();
        await Jobs.updateMany({ created_at: { $lte: older_than } }, { status: false });
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}
const verifyJobs = {
    stopJobsOlderThanFiveDays
}

module.exports = {
    verifyJobs
}