const Joi = require("joi");

const variantSchema = Joi.object({
  color: Joi.string().min(2).max(50).required().messages({
    "any.required": "Variant color is required",
    "string.empty": "Variant color cannot be empty",
  }),

  stock: Joi.number().integer().min(0).required().messages({
    "any.required": "Stock is required for each variant",
    "number.base": "Stock must be a number",
    "number.min": "Stock cannot be negative",
  }),
}).unknown(true);

// Specifications schema
const specificationSchema = Joi.object({
  strapStyle: Joi.string().allow("").max(100),
  weight: Joi.string().allow("").max(50),
  dialType: Joi.string().allow("").max(50),
  warrantyPeriod: Joi.string().allow("").max(100),
  durability: Joi.string().allow("").max(100),
  additionalInformation: Joi.string().allow("").max(1000),
});

// Main schema
const productSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .pattern(/[a-zA-Z]/)
    .required()
    .messages({
      "any.required": "Product name is required",
      "string.empty": "Product name cannot be empty",
      "string.pattern.base": "Product name must contain at least one letter",
    }),

  description: Joi.string().min(10).max(2000).required().messages({
    "any.required": "Product description is required",
    "string.empty": "Product description cannot be empty",
    "string.min": "Description must be at least 10 characters long",
  }),

  price: Joi.number().positive().required().messages({
    "any.required": "Product price is required",
    "number.base": "Price must be a valid number",
    "number.positive": "Price must be greater than 0",
  }),

  offer: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "offer must be a valid number.",
    "number.min": "offer must be at least 1%.",
    "number.max": "offer cannot exceed 100%.",
  }),

  isListed: Joi.boolean().required().messages({
    "any.required": "Listing status is required",
  }),

  category: Joi.string().required().messages({
    "any.required": "Product category is required",
    "string.empty": "Please select a category",
  }),

  variants: Joi.array().items(variantSchema).min(1).required().messages({
    "array.min": "At least one product variant is required",
  }),

  specifications: specificationSchema.optional(),
});

module.exports = productSchema;
