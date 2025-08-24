const bcrypt = require("bcrypt");
const saltRounds = 10;

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {}
};

const comparePassword = async (password, originalPassword) => {
  console.log("pas compare")
  return bcrypt.compare(password, originalPassword);
}

module.exports = {
  securePassword,
  comparePassword,
};