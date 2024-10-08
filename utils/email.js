const nodemailer = require("nodemailer");
const pug = require("pug");
const { convert } = require("html-to-text");
const { MailSlurp } = require("mailslurp-client");

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.firstName;
        this.url = url;
        this.from = `Blogssom <${process.env.EMAIL_FROM}>`;
        this.mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
    }

    // 1) Create a transporter
    newTransport() {
        if (process.env.NODE_ENV === "production") {
            // Mailslurp
            return nodemailer.createTransport({
                host: process.env.MAILSLURP_HOST,
                port: process.env.MAILSLURP_PORT,
                secure: true,
                auth: {
                    user: process.env.MAILSLURP_USERNAME,
                    pass: process.env.MAILSLURP_PASSWORD,
                },
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async send(template, subject) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });

        // 2) Define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: convert(html),
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send("Welcome", "Welcome to Blogssom!");
    }

    async sendPasswordReset() {
        await this.send("PasswordReset", "Your password reset token (valid for only 10 minutes)");
    }
};
