const nodemailer = require("nodemailer");
const { NODEMAILER_EMAIL, NODEMAILER_PASSWORD } = require("./env");

// Create transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_PASSWORD,
  },
});

// Common sendEmail function
async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: NODEMAILER_EMAIL,
      to,
      subject,
      text,
      html,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

module.exports = sendEmail;
