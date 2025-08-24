export function validateSignUpForm(name, email, phone, password, confirmPassword) {
  console.log("fornted validation reached")
  let isValid = true;
  let messages = [];

  // Full Name
  if (!name || name.trim().length < 3) {
    isValid = false;
    messages.push("Full name must be at least 3 characters.");
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    isValid = false;
    messages.push("Please enter a valid email address.");
  }

  // Phone
  const phoneRegex = /^[0-9]{10}$/;
  if (!phone || !phoneRegex.test(phone.trim())) {
    isValid = false;
    messages.push("Please enter a valid phone number.");
  }

  // Password (min 8 chars)
  if (!password || password.length < 8) {
    isValid = false;
    messages.push("Password must be at least 8 characters long.");
  }

  // Confirm Password
  if (password !== confirmPassword) {
    isValid = false;
    messages.push("Passwords do not match.");
  }

  // Referral Code (optional)
  // if (referralCode && !/^[A-Za-z0-9]+$/.test(referralCode)) {
  //   isValid = false;
  //   messages.push("Referral code must be alphanumeric only.");
  // }

  return { isValid, messages };
}

export function validateLogInForm(email, password) {
  console.log("validation reached frontend");
  let isValid = true;
  let messages = [];

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    isValid = false;
    messages.push("Please enter a valid email address.");
  }

  // Password (min 8 chars, strong)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    isValid = false;
    messages.push(
      "Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character."
    );
  }

  return { isValid, messages };
}
