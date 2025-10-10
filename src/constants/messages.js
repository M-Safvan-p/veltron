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
  GOOGLE_AUTH_USER: "This account was created using Google. Please continue with Google login.",

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
  PRODUCT_OUT_OF_STOCK: "Product is out of stock.",

  // Cart
  CART_ADD_SUCCESS: "Item added to cart successfully.",
  CART_ADD_FAILED: "Failed to add item to cart. Please try again.",
  CART_REMOVE_FAILED: "Failed to remove item from cart. Please try again.",
  CART_QUANTITY_LIMIT: "You have reached the maximum quantity for this item.",
  CART_EMPTY: "Your cart is currently empty.",
  NO_VALID_ITEMS_IN_CART: "No valid items in cart.",

  // Variant
  VARIANT_COLOR_REQUIRED: (i) => `Variant ${i + 1} requires a color (please enter a color name).`,
  VARIANT_IMAGE_REQUIRED: (i) => `Variant ${i + 1} must have at least 3 images.`,
  VARIANT_IMAGE_PROCESS_FAILED: (index) => `Failed to process images for variant ${index}.`,
  VARIANT_IMAGE_UPLOAD_FAILED: (index) => `Failed to upload image for variant ${index} to Cloudinary.`,

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

  // Payment
  PAYMENT_METHOD_NOT_FOUND: "Payment method not found.",
  PAYMENT_VERIFIED_SUCCESS: "Payment verified successfully.",
  PAYMENT_VERIFIED_FAILED: "Payment verification failed.",
  INVALID_AMOUNT: "Invalid amount. Please enter a positive number.",
  INSUFFICIENT_BALANCE: "Insufficient balance. Please add money to the wallet to continue.",
  // Orders
  // ORDER_PLACED_SUCCESS: "Your order has been placed successfully.",
  // ORDER_PROCESSING: "We are processing your order.",
  // ORDER_SHIPPED: "Your order has been shipped.",
  // ORDER_OUT_FOR_DELIVERY: "Your order is out for delivery.",
  // ORDER_DELIVERED: "Your order has been delivered successfully.",
  // ORDER_FAILED: "We were unable to process your order. Please try again.",
  ORDER_CANCELLED: "Your order has been cancelled.",
  ORDER_NOT_FOUND: "Order not found. Please check your order ID.",
  ORDER_STATUS_UPDATED: "Order status updated.",
  ORDER_ITEM_NOT_FOUND: (productId, variantId) => `Product ${productId} with variant ${variantId} not found in this order.`,
  ORDER_RETURN_QUANTITY_EXCEEDS: (productId) => `Return quantity for product ${productId} exceeds purchased quantity.`,
  // razorpay
  RAZORPAY_ORDER_CREAT: "Razorpay order created",
  // ORDER_UPDATE_FAILED: "Your order could not be updated at this time. Please try later.",
  // ORDER_PAYMENT_RECEIVED: "We’ve received your payment. Your order is confirmed.",
  // ORDER_ID_REQUIRED: "Order ID is required.",
  // ORDER_ALREADY_EXISTS: "This order already exists.",

  // password validationn
  VALIDATION_BOTH_FIELD_REQUIRED: "Both new password and confirm password are required.",
  VALIDATION_PASSWORD_LENGTH: "Password must be at least 8 characters long.",
  VALIDATION_PASSWORD_MISMATCH: "Passwords do not match.",
  VALIDATION_PASSWORD_STRENGTH: "Password must include at least 1 uppercase letter, 1 number, and 1 special character.",
  // wishlist
  PRODUCT_ALREADY_EXISTS_IN_WISHLIST: "This product is already in your wishlist.",
  PRODUCT_ADDED_IN_WISHLIST: "Product has been added to your wishlist.",

  // coupon
  COUPON_ALREADY_EXIST: "Coupon already exist",
  // Server errors
  SERVER_ERROR: "An error occurred. Please try again later.",
};

module.exports = Messages;
