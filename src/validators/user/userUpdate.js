const Joi = require("joi");

const profileSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
      "string.max": "Full name must be less than 50 characters",
      "string.pattern.base": "Full name should contain only letters and spaces",
    }),

  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/) // must be exactly 10 digits
    .custom((value, helpers) => {
      if (/^0{10}$/.test(value)) {
        return helpers.error("any.invalid"); // reject 0000000000
      }
      return value;
    })
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 10 digits",
      "any.invalid": "Phone number cannot be all zeros",
    }),
});

module.exports = profileSchema;
