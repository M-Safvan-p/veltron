const Joi = require("joi");

const couponSchema = Joi.object({
  code: Joi.string()
    .trim()
    .uppercase()
    .min(3)
    .max(20)
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .messages({
      "string.empty": "Coupon code is required.",
      "string.pattern.base": "Coupon code must contain only uppercase letters and numbers.",
      "string.min": "Coupon code must be at least 3 characters.",
      "string.max": "Coupon code must not exceed 20 characters.",
    }),

  description: Joi.string().trim().max(200).required().messages({
    "string.empty": "Description is required.",
    "string.max": "Description must not exceed 200 characters.",
  }),

  minPurchase: Joi.number().min(100).precision(2).required().messages({
    "number.base": "Minimum purchase must be a valid number.",
    "number.min": "Minimum purchase must be at least 100.",
  }),

  discount: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "Discount must be a valid number.",
    "number.min": "Discount must be at least 1%.",
    "number.max": "Discount cannot exceed 100%.",
  }),

  expiryDate: Joi.date().greater("now").required().messages({
    "date.greater": "Expiry date must be a future date.",
    "date.base": "Invalid date format.",
    "any.required": "Expiry date is required.",
  }),

  maxUsage: Joi.number().integer().min(1).max(1000000).required().messages({
    "number.base": "Max usage must be a valid number.",
    "number.min": "Max usage must be at least 1.",
    "number.max": "Max usage cannot exceed 1,000,000.",
  }),
}).prefs({ abortEarly: false, convert: true, stripUnknown: true });

module.exports = couponSchema;
