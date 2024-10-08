const User = require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const cloudinary = require("../utils/cloudinary");

const getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find();

    res.status(200).json({
        status: "success",
        results: users.length,
        data: {
            users,
        },
    });
});

const getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) return next(new AppError("No user found with that ID", 404));

    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    });
});

const updateUser = catchAsync(async (req, res, next) => {
    const { firstName, lastName, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, email },
        { new: true, runValidators: true }
    );

    if (!updatedUser) return next(new AppError("No user found with that ID", 404));

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        },
    });
});

const deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, { active: false });

    if (!user) return next(new AppError("No user found with that ID", 404));

    res.status(204).json({
        status: "success",
        data: null,
    });
});

const createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not defined! Please use /signup instead",
    });
};

const getMe = catchAsync(async (req, res) => {
    const user = req.user;

    const currentUser = await User.findById(user.id);

    res.status(200).json({
        status: "success",
        data: {
            user: currentUser,
        },
    });
});
const filteredObj = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};

const uploadMyAvatar = catchAsync(async (req, res, next) => {
    const user = req.user;
    let filteredBody = {};

    // if (!req.file) return next();

    // const result = await cloudinary.uploader.upload(req.file.path);
    // const filteredBody = filteredObj({ avatar: result.secure_url }, "avatar");

    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        filteredBody = filteredObj({ avatar: result.secure_url }, "avatar");
    }

    // If no file is uploaded, then don't  update the avatar
    const updatedUser = await User.findByIdAndUpdate(user.id, filteredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        },
    });
});

const updateMe = catchAsync(async (req, res, next) => {
    const user = req.user;

    if (req.body.password)
        return next(
            new AppError(
                "This route is not for password updates. Please use /updateMyPassword",
                400
            )
        );

    const filteredBody = filteredObj(req.body, "firstName", "lastName", "email", "avatar");
    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        filteredBody.avatar = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(user.id, filteredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        },
    });
});

const deleteMe = catchAsync(async (req, res) => {
    const user = req.user;
    await User.findByIdAndUpdate({ _id: user.id }, { active: false });

    res.status(204).json({ status: "success", data: null });
});

module.exports = {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    createUser,
    getMe,
    uploadMyAvatar,
    updateMe,
    deleteMe,
};
