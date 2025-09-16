const bcrypt = require("bcrypt");
const saltRounds = 10;

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log("pasword hashing erro", error);
  }
};

const comparePassword = async (password, originalPassword) => {
  return bcrypt.compare(password, originalPassword);
};

module.exports = {
  securePassword,
  comparePassword,
};
