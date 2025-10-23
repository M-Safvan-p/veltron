const Joi = require("joi");

// High-level bulletproof schema
const contactSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 2 characters",
      "string.max": "Full name cannot exceed 100 characters",
      "string.pattern.base": "Full name can only contain letters and spaces",
    }),

  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),

  subject: Joi.string().trim().min(3).max(150).required().messages({
    "string.empty": "Subject is required",
    "string.min": "Subject must be at least 3 characters",
    "string.max": "Subject cannot exceed 150 characters",
  }),

  message: Joi.string().trim().min(10).max(2000).required().messages({
    "string.empty": "Message is required",
    "string.min": "Message must be at least 10 characters",
    "string.max": "Message cannot exceed 2000 characters",
  }),
});

module.exports = contactSchema;
