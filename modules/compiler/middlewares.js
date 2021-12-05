let compiler = require('compilex');

obtainment = async (req, res, next) => {
    compiler.fullStat(function (data) {
        if (data.fileDetails.python === 0 && req.query.lang === "Python") {
            return res.status(500).send({
                status: 500,
                message: "Server can not compile python code right now!",
                success: false
            });
        }
        next()
    });
}

const state = {
    obtainment
}
module.exports = {
    state
}