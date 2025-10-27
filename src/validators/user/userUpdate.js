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
      // Disallow all zeros
      if (/^0{10}$/.test(value)) {
        return helpers.error("any.invalid", { message: "Phone number cannot be all zeros" });
      }

      // Disallow sequential numbers like 1234567890 or 9876543210
      if (value === "1234567890" || value === "9876543210") {
        return helpers.error("any.invalid", { message: "Phone number cannot be sequential numbers" });
      }

      // Disallow all identical digits like 1111111111
      if (/^(\d)\1{9}$/.test(value)) {
        return helpers.error("any.invalid", { message: "Phone number cannot have all identical digits" });
      }

      return value;
    })
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be exactly 10 digits",
      "any.invalid": "{{#message}}",
    }),
});

module.exports = profileSchema;
