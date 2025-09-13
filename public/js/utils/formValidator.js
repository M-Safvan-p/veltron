function validateSignUpForm(name, email, phone, password, confirmPassword) {
  console.log('fornted validation reached');
  let isValid = true;
  let messages = [];

  // Full Name
  if (!name || name.trim().length < 3) {
    isValid = false;
    messages.push('Full name must be at least 3 characters.');
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    isValid = false;
    messages.push('Please enter a valid email address.');
  }

  // Phone
  const phoneRegex = /^[0-9]{10}$/;
  if (!phone || !phoneRegex.test(phone.trim())) {
    isValid = false;
    messages.push('Please enter a valid phone number.');
  }

  // Password (min 8 chars)
  if (!password || password.length < 8) {
    isValid = false;
    messages.push('Password must be at least 8 characters long.');
  }

  // Confirm Password
  if (password !== confirmPassword) {
    isValid = false;
    messages.push('Passwords do not match.');
  }

  // Referral Code (optional)
  // if (referralCode && !/^[A-Za-z0-9]+$/.test(referralCode)) {
  //   isValid = false;
  //   messages.push("Referral code must be alphanumeric only.");
  // }

  return { isValid, messages };
}

function validateLogInForm(email, password) {
  console.log('validation reached frontend');
  let isValid = true;
  let messages = [];

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    isValid = false;
    messages.push('Please enter a valid email address.');
  }

  // Password (min 8 chars, strong)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    isValid = false;
    messages.push('Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character.');
  }

  return { isValid, messages };
}

function validateCategory(categoryName, description, isListed) {
  console.log('frontend validation for Category reached');
  let isValid = true;
  let messages = [];

  // Category Name: only letters and spaces, min 3 chars, max 50
  const nameRegex = /^[A-Za-z ]{3,50}$/;
  if (!categoryName || !nameRegex.test(categoryName.trim())) {
    isValid = false;
    messages.push('Category Name must be 3–50 characters long and contain only letters and spaces.');
  }

  // Description: optional, but if given must be 5–200 chars
  if (description && (description.trim().length < 5 || description.trim().length > 200)) {
    isValid = false;
    messages.push('Description must be between 5 and 200 characters (if provided).');
  }

  // isListed: must be "true" or "false"
  if (isListed !== 'true' && isListed !== 'false') {
    isValid = false;
    messages.push("Category status must be either 'true' (listed) or 'false' (unlisted).");
  }

  return { isValid, messages };
}

function validateProductForm(data) {
  console.log('frontend validation reached');
  let isValid = true;
  let messages = [];

  // Product name
  if (!data.name || data.name.trim().length < 3) {
    isValid = false;
    messages.push('Product name must be at least 3 characters long.');
  }

  // Description (required)
  if (!data.description || data.description.trim().length === 0) {
    isValid = false;
    messages.push('Description is required.');
  } else if (data.description.trim().length < 10) {
    isValid = false;
    messages.push('Description must be at least 10 characters long.');
  }

  // Price (required)
  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
    isValid = false;
    messages.push('Price must be greater than 0.');
  }

  // Discounted Price (optional, but must be less than price if provided)
  if (data.discountedPrice !== undefined && data.discountedPrice !== null && data.discountedPrice !== '') {
    const discountedPrice = parseFloat(data.discountedPrice);
    if (isNaN(discountedPrice) || discountedPrice < 0) {
      isValid = false;
      messages.push('Discounted price must be 0 or more.');
    }
    if (!isNaN(price) && !isNaN(discountedPrice) && discountedPrice >= price) {
      isValid = false;
      messages.push('Discounted price must be less than actual price.');
    }
  }

  // Category (required ObjectId)
  if (!data.category) {
    isValid = false;
    messages.push('Please select a valid category.');
  }

  // Variants (array, at least one required)
  if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
    isValid = false;
    messages.push('At least one variant is required.');
  } else {
    const variantColors = [];
    data.variants.forEach((variant, index) => {
      // Color is required for each variant
      if (!variant.color || variant.color.trim() === '') {
        isValid = false;
        messages.push(`Variant ${index + 1}: Color is required.`);
      } else {
        // Check for duplicate colors
        const normalizedColor = variant.color.trim().toLowerCase();
        if (variantColors.includes(normalizedColor)) {
          isValid = false;
          messages.push(`Variant ${index + 1}: Color "${variant.color}" already exists. Each variant must have a unique color.`);
        } else {
          variantColors.push(normalizedColor);
        }
      }

      // Stock validation (defaults to 0 in schema)
      if (variant.stock !== undefined && variant.stock !== null) {
        const stock = parseInt(variant.stock.toString().trim());
        if (isNaN(stock) || stock < 0) {
          isValid = false;
          messages.push(`Variant ${index + 1}: Stock must be 0 or more.`);
        }
      }

      // Images validation (at least 3 required)
      if (!variant.images || !Array.isArray(variant.images)) {
        isValid = false;
        messages.push(`Variant ${index + 1}: Images are required.`);
      } else if (variant.images.length < 3) {
        isValid = false;
        messages.push(`Variant ${index + 1}: At least 3 images are required.`);
      }
    });
  }

  // Specifications
  if (!data.specifications) {
    isValid = false;
    messages.push('Product specifications are required.');
  } else {
    // Required specification fields based on schema
    const requiredSpecFields = ['strapStyle'];
    requiredSpecFields.forEach(field => {
      if (!data.specifications[field] || data.specifications[field].trim() === '') {
        isValid = false;
        messages.push(`${field} is required in specifications.`);
      }
    });
  }

  return { isValid, messages };
}
