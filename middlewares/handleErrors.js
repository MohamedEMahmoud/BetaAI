function handleErrors(error, req, res, next) {
    res.status(400).send({status: 400, message: error.message, success: false});
    next();
}

module.exports = handleErrors;