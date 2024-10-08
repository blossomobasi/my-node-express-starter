const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.log(err.name, err.message, err.stack);
    process.exit(1);
});

const app = require("./index.js");

// DB connection
const DB = process.env.DB_URL;
mongoose.connect(DB).then(() => console.log("DB connection successful!"));

// Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message);

    server.close(() => {
        process.exit(1);
    });
});
