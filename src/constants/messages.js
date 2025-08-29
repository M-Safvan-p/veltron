const Messages = {
  // Signup & OTP
  SIGNUP_SUCCESS: "OTP sent to your email",
  EMAIL_ALREADY_EXISTS: "Brand email already exists",
  PHONE_ALREADY_EXISTS: "Phone number already exists",
  OTP_INVALID: "Invalid OTP",
  OTP_EXPIRED: "OTP has expired. Please request a new one.",
  OTP_SEND_FAILED: "Failed to send verification email",
  OTP_VERIFIED: "Vendor registered successfully",

  // Login
  INVALID_CREDENTIALS: "Invalid credential",
  LOGIN_SUCCESS: "Login successful",
  REGISTRATION_PENDING: "Your registration is under review and awaiting administrator approval.",
  REGISTRATION_REJECTED: "We regret to inform you that your account request has been rejected.",

  // Server errors
  SERVER_ERROR: "An error occurred. Please try again later.",
};

module.exports = Messages;
