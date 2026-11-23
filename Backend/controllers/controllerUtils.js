const mongoose = require("mongoose");

function sendControllerError(res, error) {
    let status = 500;

    if (error instanceof mongoose.Error.ValidationError ||
        error.name === "ValidationError" ||
        error instanceof mongoose.Error.CastError) {
        status = 400;
    } else if (error.code === 11000) {
        status = 409;
    }

    res.status(status).json({
        success: false,
        message: error.message || "Request failed"
    });
}

function isValidObjectId(id) {
    return mongoose.isValidObjectId(id);
}

module.exports = {
    sendControllerError,
    isValidObjectId
};
