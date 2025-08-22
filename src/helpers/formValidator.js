const validateSignUp = ({ fullName, email, phoneNumber, password, confirmPassword, refferalCode }) => {
  // Full name validation
  const nameRegex = /^[A-Za-z\s]{3,}$/;
  if (!fullName || !nameRegex.test(fullName)) {
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

  // Optional: referral code
  if (refferalCode && refferalCode.length < 6) {
    return "Invalid referral code.";
  }

  return null; 
};

const validateLogIn = (email, password) => {
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

module.exports = { 
  validateSignUp,
  validateLogIn
};
