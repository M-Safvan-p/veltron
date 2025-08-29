// success
const success = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};
// error
const error = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { success, error };
