const path = require("path");
const helmet = require("helmet");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const compression = require("compression");

const globalErrorHandler = require("./controller/errorController");

const app = express();

// VIEW ENGINE
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

const corsOptions = {
    origin:
        process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_URL_PROD
            : process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: "Content-Type, Authorization",
    methods: "GET, POST, PATCH, DELETE, OPTIONS",
};

app.use(cors(corsOptions));

// MIDDLEWARES
app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (Cross Site Scripting)
app.use(xss());

// ROUTES
require("./routes")(app);

// ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
