// success
const success = (res, statusCode = 200, message = "", data = {}) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};
// error
const error = (res, statusCode = 500, message = "Something went wrong") => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { success, error };
