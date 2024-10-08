const AppError = require("./utils/appError");

module.exports = function (app) {
    app.get("/", (req, res) => {
        res.status(200).json({
            status: "success",
            message: "APPLICATION IS RUNNING",
            version: "1.0.0",
        });
    });

    // Routes

    // Route not found
    app.all("*", (req, res, next) => {
        next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
    });
};
