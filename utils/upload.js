const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "avatars",
        allowedFormats: ["jpeg", "png", "jpg"],
        public_id: (req, file) => `${req.user.id}-${file.originalname.split(".")[0]}-${Date.now()}`,
    },
});

const uploadAvatar = multer({ storage: avatarStorage });

module.exports = { uploadAvatar };
