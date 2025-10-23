const validate = (schema) => {
  return (req, res, next) => {
    try {
      //req body
      console.log("data to validate ", req.body);
      const { error } = schema.validate(req.body, { abortEarly: false });
      if (error) {
        const errorMessages = error.details.map((err) => err.message);
        console.log("middleware validation reached", errorMessages);
        return res.status(400).json({
          success: false,
          message: errorMessages.join("<br>"),
          errors: errorMessages,
        });
      }
      next();
    } catch (err) {
      console.error("Validation middleware error:", err);
      return res.status(500).json({
        success: false,
        message: "Validation error",
        error: err.message,
      });
    }
  }; 
};

module.exports = validate;
