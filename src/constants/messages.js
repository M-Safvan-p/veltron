const Messages = {
  // Signup & OTP
  SIGNUP_SUCCESS: "OTP sent to your email",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  PHONE_ALREADY_EXISTS: "Phone number already exists",
  OTP_INVALID: "Invalid OTP",
  OTP_EXPIRED: "OTP has expired. Please request a new one.",
  OTP_SENT_SUCCESS: "OTP sent to your email",
  OTP_SEND_FAILED: "Failed to send OTP email. Please try again later.",
  OTP_VERIFIED: "Registered successfully",
  SESSION_EXPIRED: "Session expired. Please register again.",
  EMAIL_SEND_FAILED: "Could not send verification email.",
  OTP_RESENT_SUCCESS: "A new OTP has been sent to your email.",
  OTP_RESEND_FAILED: "Could not resend OTP. Please try again later.",

  // Login
  LOGIN_SUCCESS: "Login successful",
  INVALID_CREDENTIALS: "Invalid credential",
  
  // User
  USER_ALREADY_EXISTS:"User already exists",
  LOGIN_USER_NOT_FOUND: "User not found.",
  // Vendor
  VENDOR_REGISTER_SUCCESS: "Vendor registered successfully.",
  VENDOR_EMAIL_ALREADY_EXISTS: "Brand email already exists",
  VENDOR_ID_REQUIRED: "Vendor ID is required",
  VENDOR_NOT_FOUND: "Vendor not found",
  VENDOR_APPROVED_SUCCESS: "Vendor has been approved successfully.",
  VENDOR_REJECTED_SUCCESS: "Vendor has been rejected successfully.",
  REGISTRATION_PENDING: "Your registration is under review and awaiting administrator approval.",
  REGISTRATION_REJECTED: "We regret to inform you that your account request has been rejected.",

  // Category
  CATEGORY_NOT_FOUND: "Category not found",
  CATEGORY_LISTED: "Category has been listed successfully.",
  CATEGORY_UNLISTED: "Category has been unlisted successfully.",
  CATEGORY_ALREADY_EXISTS: "Category already exists.",
  CATEGORY_ADDED: "Category has been added successfully",
  CATEGORY_UPDATED: "Category has been updated successfully.",

  // Server errors
  SERVER_ERROR: "An error occurred. Please try again later.",
};

module.exports = Messages;
