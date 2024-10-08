const express = require("express");
const userController = require("../controller/userController");
const authController = require("../controller/authController");
const { uploadAvatar } = require("../utils/upload");
const router = express.Router();

router.get("/logout", authController.protect, authController.logout);
router.route("/login").post(authController.login);
router.route("/signup").post(authController.signup);

router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);

// USER ROUTES
router.use(authController.protect);

router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMyPassword", authController.updatePassword);
router.patch("/updateMe", uploadAvatar.single("avatar"), userController.updateMe);
router.patch("/uploadMyAvatar", uploadAvatar.single("avatar"), userController.uploadMyAvatar);
router.delete("/deleteMe", userController.deleteMe);

// SUPER ADMIN ROUTES
router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers).post(userController.createUser);
router
    .route("/:id")
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
