const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");
const { signToken } = require("../utils/token");

function createSendToken(user, statusCode, res) {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "Strict",
    };

    res.cookie("token", token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
}

const signup = catchAsync(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const newUser = await User.create({
        firstName,
        lastName,
        email,
        password,
    });

    const url =
        process.env.NODE_ENV === "production"
            ? `${process.env.FRONTEND_PROD_URL}/me`
            : `${process.env.FRONTEND_URL}/me`;
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) return next(new AppError("Please provide email and password!", 400));

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password)))
        return next(new AppError("Incorrect email or password!", 401)); // 401: Unauthorized

    createSendToken(user, 200, res);
});
const logout = catchAsync(async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "Strict",
    });

    res.status(204).json({ status: "success", data: null });
});

const protect = catchAsync(async (req, res, next) => {
    let token;

    // Check if token exists
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) return next(new AppError("You are not logged in! Log in to get Access", 401)); // Unauthorized

    // Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user)
        return next(new AppError("The user belonging to the token does not longer exit!", 401));

    if (await user.changedPasswordAfter(decoded.iat))
        return next(new AppError("User recently changed password! Please log in again.", 401));

    req.user = user;

    // GRANT ACCESS TO PROTECTED ROUTE
    next();
});

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role))
            return next(new AppError("You do not have permission to perform this action", 403)); // 403: Forbidden

        next();
    };
};

const forgotPassword = catchAsync(async (req, res, next) => {
    const email = req.body.email;

    if (!email) return next(new AppError("Please provide your email!", 400));

    const user = await User.findOne({ email });

    if (!user) return next(new AppError("No user with this email address.", 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        const resetURL =
            process.env.NODE_ENV === "production"
                ? `${process.env.FRONTEND_PROD_URL}/reset-password?resetToken=${resetToken}`
                : `${process.env.FRONTEND_URL}/reset-password?resetToken=${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: "success",
            message: "Token sent to email!",
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError("There was an error sending the email. Try again Later!"), 500);
    }
});

const resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) return next(new AppError("Please provide token and password!", 400));

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError("Token is invalid or has expired", 400));

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    createSendToken(user, 200, res);
});

const updatePassword = catchAsync(async (req, res, next) => {
    const user = req.user;
    const currentUser = await User.findById(user.id).select("+password");

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
        return next(new AppError("Please provide your current password and new password!", 400));

    if (!(await currentUser.correctPassword(currentPassword, currentUser.password)))
        return next(new AppError("Your current password is wrong!", 401));

    currentUser.password = newPassword;

    await currentUser.save();

    createSendToken(currentUser, 200, res);
});

module.exports = {
    signup,
    login,
    logout,
    protect,
    restrictTo,
    forgotPassword,
    resetPassword,
    updatePassword,
};
