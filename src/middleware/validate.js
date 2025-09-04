const validate = (schema) => {
  return (req, res, next) => {
      const { error } = schema.validate(req.body, { abortEarly: false });
      if (error) {
          const errorMessages = error.details.map(err => err.message);
          console.log("middleware validateion reach", errorMessages)

      return res.status(400).json({
        success: false,
        message: errorMessages.join("<br>"),
        errors: errorMessages
      });
    }
    next(); 
  };
};

module.exports = validate;
