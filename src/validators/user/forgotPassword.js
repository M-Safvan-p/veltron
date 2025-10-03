const Joi = require("joi");

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const forgotPasswordSchema = Joi.object({
  otp: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.empty": "OTP is required.",
      "any.required": "OTP is required.",
      "string.pattern.base": "OTP must be a valid 4-digit code.",
    }),

  newPassword: Joi.string().pattern(strongPasswordRegex).required().messages({
    "string.empty": "New password cannot be empty.",
    "string.pattern.base": "Password must have at least 8 characters, including uppercase, lowercase, number, and special character.",
  }),

  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Confirm password must match new password.",
    "any.required": "Confirm password is required.",
  }),
});

module.exports = forgotPasswordSchema;
