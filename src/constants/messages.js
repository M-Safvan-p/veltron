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
  USER_ALREADY_EXISTS: "User already exists",
  LOGIN_USER_NOT_FOUND: "User not found.",
  USER_BLOCKED: "Your account has been blocked.",
  USER_UPDATE_SUCCESS: "Profile updated successfully.",
  USER_UPDATE_FAILED: "Failed to update profile. Please try again.",
  USER_NOT_LOGIN: "You must be logged in to add items to the cart.",

  // Vendor
  VENDOR_REGISTER_SUCCESS: "Vendor registered successfully.",
  VENDOR_EMAIL_ALREADY_EXISTS: "Brand email already exists",
  VENDOR_BLOCKED: "Your vendor account has been blocked.",
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

  // Product
  PRODUCT_NOT_FOUND: "Product not found",
  INVALID_PRODUCT_ID: "Invalid product ID.",
  PRODUCT_ALREADY_EXISTS: "Product already exists.",
  PRODUCT_ADDED: "Product has been added successfully.",
  PRODUCT_UPDATED: "Product has been updated successfully.",

  // Cart
  CART_ADD_SUCCESS: "Item added to cart successfully.",
  CART_ADD_FAILED: "Failed to add item to cart. Please try again.",
  CART_REMOVE_FAILED: "Failed to remove item from cart. Please try again.",
  CART_QUANTITY_LIMIT: "You have reached the maximum quantity for this item.",

  // Variant
  VARIANT_COLOR_REQUIRED: (i) => `Variant ${i + 1} requires a color (please enter a color name).`,
  VARIANT_IMAGE_REQUIRED: (i) => `Variant ${i + 1} must have at least 3 images.`,
  VARIANT_IMAGE_PROCESS_FAILED: (index) => `Failed to process images for variant ${index}.`,
  VARIANT_IMAGE_UPLOAD_FAILED: (index) =>
    `Failed to upload image for variant ${index} to Cloudinary.`,

  // Password
  WRONG_CURRENT_PASSWORD: "Current password is incorrect.",
  UPDATE_SUCCESS_PASSWORD: "Password updated successfully!",

  // Email
  INVALID_EMAIL: "Invalid email address.",
  EMAIL_UPDATE_SUCCESS: "Email updated successfully.",

  // Address
  ADDRESS_CREATED: "Address created successfully",
  ADDRESS_UPDATED: "Address updated successfully",
  ADDRESS_DELETED: "Address deleted successfully",
  ADDRESS_NOT_FOUND: "Address not found",

  PAYMENT_METHOD_NOT_FOUND: "Payment method not found.",
  NO_VALID_ITEMS_IN_CART: "No valid items in cart.",
  // Server errors
  SERVER_ERROR: "An error occurred. Please try again later.",
};

module.exports = Messages;
