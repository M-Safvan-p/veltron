const Joi = require("joi");

const addressSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
      "string.max": "Full name cannot exceed 100 characters",
      "string.pattern.base": "Full name should contain only letters and spaces",
    }),

  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),

  fullAddress: Joi.string().trim().min(5).max(200).messages({
    "string.empty": "Address is required",
    "string.min": "Address must be at least 5 characters long",
    "string.max": "Address cannot exceed 200 characters",
  }),

  district: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      "string.empty": "District is required",
      "string.pattern.base": "District must contain only letters",
    }),

  state: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      "string.empty": "State is required",
      "string.pattern.base": "State must contain only letters",
    }),

  city: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      "string.empty": "City is required",
      "string.pattern.base": "City must contain only letters",
    }),

  pincode: Joi.string()
    .trim()
    .pattern(/^[0-9]{6}$/)
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be a valid 6-digit number",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9\s-]{10,15}$/)
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 10–15 digits (can include +, space, -)",
    }),

  type: Joi.string().valid("Home", "Work", "Other").default("Home").messages({
    "any.only": "Address type must be Home, Work, or Other",
  }),
});

module.exports = addressSchema;
