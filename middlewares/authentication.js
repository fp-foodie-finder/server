const { verifyToken } = require("../helpers/jwt");
const User = require("../models/user");

const authentication = async (req, res, next) => {
  try {
    // Check apakah user membawa token atau tidak
    const { authorization } = req.headers;
    if (!authorization) throw { name: "InvalidToken" };

    // check apakah tipe tokennya bearer
    const [type, token] = authorization.split(" ");
    if (type !== "Bearer") throw { name: "InvalidToken" };

    // check apakah token asli atau tidak
    const { id } = verifyToken(token);

    // check ke db, apakah isi token sesuai atau tidak
    const user = await User.findById(id);
    if (!user) throw { name: "InvalidToken" };

    req.user = user;

    // lanjutkan ke endpoint
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authentication;
