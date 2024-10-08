const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "firstName is required!"],
        },
        lastName: {
            type: String,
            required: [true, "lastName is required!"],
        },
        email: {
            type: String,
            required: [true, "email is required!"],
            unique: true,
            match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please provide a valid email"], // regex for email validation
        },
        avatar: {
            type: String,
            default:
                "https://res.cloudinary.com/dt0ztptgs/image/upload/v1724925223/gbyg5hwohejzvyowbghf.jpg",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        password: {
            type: String,
            required: [true, "password is required!"],
            minlength: 8,
            select: false,
        },

        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.methods.correctPassword = async (candidatePassword, userPassword) => {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
