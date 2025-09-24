const User = require("../models/user/userSchema");

const getUser = (filter, lean = true) => {
  return lean ? User.findOne(filter).lean() : User.findOne(filter);
};

module.exports = {
  getUser,
};
