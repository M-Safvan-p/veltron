function validateSignUpForm(name, email, phone, password, confirmPassword) {
  console.log("fornted validation reached");
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
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    isValid = false;
    messages.push("Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character.");
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

function validateProductForm(data) {
  console.log("frontend validation reached");
  let isValid = true;
  let messages = [];

  // Product name validation
  if (!data.name || data.name.trim().length < 3) {
    isValid = false;
    messages.push("Product name must be at least 3 characters long.");
  } else if (data.name.trim().length > 100) {
    isValid = false;
    messages.push("Product name must not exceed 100 characters.");
  }

  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    isValid = false;
    messages.push("Description is required.");
  } else if (data.description.trim().length < 10) {
    isValid = false;
    messages.push("Description must be at least 10 characters long.");
  } else if (data.description.trim().length > 1000) {
    isValid = false;
    messages.push("Description must not exceed 1000 characters.");
  }

  // Price validation
  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
    isValid = false;
    messages.push("Price must be greater than 0.");
  } else if (price > 999999) {
    isValid = false;
    messages.push("Price must not exceed ₹9,99,999.");
  }

  // Offer validation
  if (data.offer !== undefined && data.offer !== null && data.offer !== "") {
    const offer = parseFloat(data.offer);
    if (isNaN(offer) || offer < 0) {
      isValid = false;
      messages.push("Offer percentage must be 0 or more.");
    } else if (offer > 100) {
      isValid = false;
      messages.push("Offer percentage cannot exceed 100%.");
    }
  }

  // Category validation
  if (!data.category || data.category === "mechanical") {
    isValid = false;
    messages.push("Please select a valid category.");
  }

  // Variants validation
  if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
    isValid = false;
    messages.push("At least one variant is required.");
  } else {
    const variantColors = [];
    data.variants.forEach((variant, index) => {
      // Color validation
      if (!variant.color || variant.color.trim() === "") {
        isValid = false;
        messages.push(`Variant ${index + 1}: Color is required.`);
      } else if (variant.color.trim().length < 2) {
        isValid = false;
        messages.push(`Variant ${index + 1}: Color must be at least 2 characters long.`);
      } else if (variant.color.trim().length > 30) {
        isValid = false;
        messages.push(`Variant ${index + 1}: Color must not exceed 30 characters.`);
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

      // Stock validation
      if (variant.stock !== undefined && variant.stock !== null) {
        const stock = parseInt(variant.stock.toString().trim());
        if (isNaN(stock) || stock < 0) {
          isValid = false;
          messages.push(`Variant ${index + 1}: Stock must be 0 or more.`);
        } else if (stock > 9999) {
          isValid = false;
          messages.push(`Variant ${index + 1}: Stock must not exceed 9999.`);
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

  // Specifications validation
  if (!data.specifications) {
    isValid = false;
    messages.push("Product specifications are required.");
  } else {
    // Strap Style validation
    if (!data.specifications.strapStyle || data.specifications.strapStyle.trim() === "") {
      isValid = false;
      messages.push("Strap Style is required.");
    } else if (data.specifications.strapStyle.trim().length < 2) {
      isValid = false;
      messages.push("Strap Style must be at least 2 characters long.");
    } else if (data.specifications.strapStyle.trim().length > 50) {
      isValid = false;
      messages.push("Strap Style must not exceed 50 characters.");
    }

    // Weight validation
    if (!data.specifications.weight || data.specifications.weight.trim() === "") {
      isValid = false;
      messages.push("Weight is required.");
    } else if (data.specifications.weight.trim().length < 2) {
      isValid = false;
      messages.push("Weight must be at least 2 characters long.");
    } else if (data.specifications.weight.trim().length > 30) {
      isValid = false;
      messages.push("Weight must not exceed 30 characters.");
    }

    // Dial Type validation
    if (!data.specifications.dialType || data.specifications.dialType.trim() === "") {
      isValid = false;
      messages.push("Dial Type is required.");
    } else if (data.specifications.dialType.trim().length < 2) {
      isValid = false;
      messages.push("Dial Type must be at least 2 characters long.");
    } else if (data.specifications.dialType.trim().length > 50) {
      isValid = false;
      messages.push("Dial Type must not exceed 50 characters.");
    }

    // Warranty Period validation
    if (!data.specifications.warrantyPeriod || data.specifications.warrantyPeriod.trim() === "") {
      isValid = false;
      messages.push("Warranty Period is required.");
    } else if (data.specifications.warrantyPeriod.trim().length < 2) {
      isValid = false;
      messages.push("Warranty Period must be at least 2 characters long.");
    } else if (data.specifications.warrantyPeriod.trim().length > 50) {
      isValid = false;
      messages.push("Warranty Period must not exceed 50 characters.");
    }

    // Durability validation
    if (!data.specifications.durability || data.specifications.durability.trim() === "") {
      isValid = false;
      messages.push("Durability is required.");
    } else if (data.specifications.durability.trim().length < 2) {
      isValid = false;
      messages.push("Durability must be at least 2 characters long.");
    } else if (data.specifications.durability.trim().length > 50) {
      isValid = false;
      messages.push("Durability must not exceed 50 characters.");
    }

    // Additional Information validation
    if (data.specifications.additionalInformation && data.specifications.additionalInformation.trim().length > 500) {
      isValid = false;
      messages.push("Additional Information must not exceed 500 characters.");
    }
  }

  return { isValid, messages };
}
