const { comparePassword, hashPassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const User = require("../models/user");

class Controller {
  // Controller Authentication
  static async register(req, res, next) {
    try {
      const { fullname, email, password, username, preference } = req.body;

      if (!fullname) throw { name: "FullNameRequired" };
      if (!username) throw { name: "UsernameRequired" };
      if (!email) throw { name: "EmailRequired" };
      if (!password) throw { name: "PassRequired" };
      if (!preference) throw { name: "PreferRequired" };

      const validEmail =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$/;
      if (!email.match(validEmail)) {
        throw { name: "FormatEmail" };
      }

      const findEmail = await User.findByEmail(email);
      if (findEmail) throw { name: "ExistEmail" };

      const newUser = {
        fullname,
        username,
        email,
        password: hashPassword(password),
        preference
      };

      const user = await User.createOne(newUser);
      newUser._id = user.insertedId;

      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  }
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) throw { name: "EmailRequired" };
      
      if (!password) throw { name: "PassRequired" };
      
      const user = await User.findByEmail(email);
      if (!user) throw { name: "InvalidLogin" };
      
      const checkPass = comparePassword(password, user.password);
      if (!checkPass) throw { name: "InvalidLogin" };
      
      const payload = { id: user._id };
      const token = signToken(payload);

      res.status(200).json({ message: "login success", token });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
