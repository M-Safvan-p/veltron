function validateSignUpForm(name, email, phone, password, confirmPassword) {
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


function validateLogInForm(email, password) {
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

function validateCategory(categoryName, description, isListed) {
  console.log("frontend validation for Category reached");
  let isValid = true;
  let messages = [];

  // Category Name: only letters and spaces, min 3 chars, max 50
  const nameRegex = /^[A-Za-z ]{3,50}$/;
  if (!categoryName || !nameRegex.test(categoryName.trim())) {
    isValid = false;
    messages.push("Category Name must be 3–50 characters long and contain only letters and spaces.");
  }

  // Description: optional, but if given must be 5–200 chars
  if (description && (description.trim().length < 5 || description.trim().length > 200)) {
    isValid = false;
    messages.push("Description must be between 5 and 200 characters (if provided).");
  }

  // isListed: must be "true" or "false"
  if (isListed !== "true" && isListed !== "false") {
    isValid = false;
    messages.push("Category status must be either 'true' (listed) or 'false' (unlisted).");
  }

  return { isValid, messages };
}
