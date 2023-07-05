import nodemailer from "nodemailer";

function sendResetPasswordEmail(num, email, name, callback) {
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });
    var mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: "Code for reset password",
        html: " Hi <strong>" + `${name}` + "</strong> <br /><br /> Your verification code is <strong>" + `${num}` + "</strong>. <br /> Enter this code in our app to reset your password.",
    };
    return transporter.sendMail(mailOptions, callback)
}

export default {
    sendResetPasswordEmail
};
  