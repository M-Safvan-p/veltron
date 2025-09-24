const Joi = require("joi");

// Regex for strong password
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const passwordSchema = Joi.object({
  currentPassword: Joi.string().pattern(strongPasswordRegex).required().messages({
    "string.empty": "Current password cannot be empty.",
    "any.required": "Current password is required.",
    "string.pattern.base": "Invalid current password.", // pattern check message
  }),

  newPassword: Joi.string()
    .pattern(strongPasswordRegex)
    .required()
    .invalid(Joi.ref("currentPassword")) // prevent new password being same as current
    .messages({
      "string.empty": "New password cannot be empty.",
      "string.pattern.base": "Password must have at least 8 characters, including uppercase, lowercase, number, and special character.",
      "any.invalid": "New password cannot be the same as current password.", // custom message
    }),

  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Confirm password must match new password.",
    "any.required": "Confirm password is required.",
  }),
});

module.exports = passwordSchema;
