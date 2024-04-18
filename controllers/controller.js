const { ObjectId } = require("bson");
const { comparePassword, hashPassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const User = require("../models/user");
const Post = require("../models/post");

class Controller {
  // Controller Home
  static async home(req, res, next) {
    try {
      res.status(200).json({ message: "Welcome to our api" });
    } catch (error) {
      next(error);
    }
  }
  // Controller Login/Register
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
        preference,
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

  // Controller Post
  static async createPost(req, res, next) {
    try {
      const { imageUrl, description } = req.body;
      const authorId = new ObjectId(String(req.user._id));

      if (!imageUrl) throw { name: "ImageUrlRequired" };
      if (!description) throw { name: "DescriptionRequired" };
      if (!authorId) throw { name: "InvalidToken" };

      const newPost = {
        imageUrl,
        description,
        authorId,
        like: [],
        dislike: [],
      };

      const result = await Post.createOne(newPost);
      newPost._id = result.insertedId;

      res.status(200).json({ message: "Post created", newPost });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
