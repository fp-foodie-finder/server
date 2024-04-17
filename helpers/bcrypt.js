const bcrypt = require("bcrypt");

function hashPassword(password) {
  const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  return hash;
}

function comparePassword(password, hashPassword) {
  const compare = bcrypt.compareSync(password, hashPassword);
  return compare;
}

module.exports = {
  hashPassword,
  comparePassword,
};
