const sendEmail = require("../config/mailer");

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// signup otp
async function sendVerificationEmail(email, otp) {
  const emailSent = await sendEmail({
    to: email,
    subject: "Verify your account",
    text: `Your OTP is ${otp}`,
    html: `
    <div style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">🔐 Email Verification</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">Thank you for signing up. Please use the following One-Time Password (OTP) to verify your account:</p>
          
          <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; background: #4CAF50; color: #fff; font-size: 22px; letter-spacing: 5px; padding: 12px 24px; border-radius: 8px;">
          ${otp}
            </span>
            </div>
            
            <p style="color: #555; font-size: 14px;">This OTP will expire in <b>1 minutes</b>. Do not share it with anyone for security reasons.</p>
            
            <p style="color: #555; font-size: 14px;">If you didn’t request this, please ignore this email.</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Veltron. All rights reserved.
            </p>
            </div>
            </div>
            `,
  });

  return emailSent;
}

// otp for changing email
async function sendChangeEmailOtp(newEmail, otp) {
  const emailSent = await sendEmail({
    to: newEmail,
    subject: "Verify your new email address",
    text: `Your OTP for changing email is ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">🔐 Verify New Email</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">You requested to change your email. Please use the following OTP to confirm your new email address:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background: #FF9800; color: #fff; font-size: 22px; letter-spacing: 5px; padding: 12px 24px; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p style="color: #555; font-size: 14px;">This OTP will expire in <b>1 minute</b>. Do not share it with anyone.</p>
          <p style="color: #555; font-size: 14px;">If you didn’t request this, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Veltron. All rights reserved.
          </p>
        </div>
      </div>
    `,
  });

  return emailSent;
}

module.exports = {
  generateOtp,
  sendVerificationEmail,
  sendChangeEmailOtp,
};
