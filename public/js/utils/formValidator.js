export function validateSignUpForm(data) {
  let isValid = true;
  let messages = [];

  // Full Name
  if (!data.fullName || data.fullName.trim().length < 3) {
    isValid = false;
    messages.push("Full name must be at least 3 characters.");
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    isValid = false;
    messages.push("Please enter a valid email address.");
  }

  // Phone
  const phoneRegex = /^[0-9]{10}$/;
  if (!data.phoneNumber || !phoneRegex.test(data.phoneNumber.trim())) {
    isValid = false;
    messages.push("Please enter a valid phone number.");
  }

  // Password (min 8 chars)
  if (!data.password || data.password.length < 8) {
    isValid = false;
    messages.push("Password must be at least 8 characters long.");
  }

  // Confirm Password
  if (data.password !== data.confirmPassword) {
    isValid = false;
    messages.push("Passwords do not match.");
  }

  // Referral Code (optional)
  if (data.referralCode && !/^[A-Za-z0-9]+$/.test(data.referralCode)) {
    isValid = false;
    messages.push("Referral code must be alphanumeric only.");
  }

  return { isValid, messages };
}

export function validateLogInForm(data) {
  let isValid = true;
  let messages = [];

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    isValid = false;
    messages.push("Please enter a valid email address.");
  }

  // Password (min 8 chars)
  if (!data.password || data.password.length < 8) {
    isValid = false;
    messages.push("Password must be at least 8 characters long.");
  }

  return { isValid, messages };
}
