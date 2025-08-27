const validateSignUp = ({ name, email, phoneNumber, password, confirmPassword }) => {
  console.log("backend validation reached")
  // name validation
  const nameRegex = /^[A-Za-z\s]{3,}$/;
  if (!name || !nameRegex.test(name)) {
    return "Full name must be at least 3 letters and contain only alphabets and spaces.";
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return "Invalid email format.";
  }

  // Phone validation (exactly 10 digits)
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
    return "Phone number must be exactly 10 digits.";
  }

  // Password validation (strong password rule)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    return "Password must be at least 8 characters, include upper and lower case letters, a number, and a special character.";
  }

  // Confirm password
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null; 
};

const validateLogIn = (email, password) => {
  console.log("backend validation reached")
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return "Invalid email format.";
  }

  // Password validation (at least 8 characters, upper, lower, number, special char)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    return "Password must be at least 8 characters long and include upper & lowercase letters, a number, and a special character.";
  }

  return null; 
};

const validateOtp = (otp) => {
  const regex = /^[0-9]{4}$/;

  if (!otp || typeof otp !== "string" || !regex.test(otp.trim())) {
    return "Invalid OTP";
  }
  return null; 
};

const validateCategory = (categoryName, description, isListed) => {
  // Category Name: only letters and spaces, min 3 chars, max 50
  const nameRegex = /^[A-Za-z ]{3,50}$/;
  if (!categoryName || !nameRegex.test(categoryName)) {
    return "Category Name must be 3-50 characters long and contain only letters and spaces.";
  }
  // Description: optional, but if given must be 5–200 chars
  const descRegex = /^.{5,200}$/;
  if (description && !descRegex.test(description)) {
    return "Description must be between 5 and 200 characters (if provided).";
  }
  // isListed: must be "true" or "false"
  if (isListed !== "true" && isListed !== "false") {
    return "Category status must be either 'true' (listed) or 'false' (unlisted).";
  }

  return null; 
};


module.exports = { 
  validateSignUp,
  validateLogIn,
  validateOtp,
  validateCategory,
};
