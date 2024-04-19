const { ObjectId } = require("bson");
const { comparePassword, hashPassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const User = require("../models/user");
const Post = require("../models/post");
const redis = require("../config/redis");
const axios = require("axios");

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
      const { fullname, email, password, username } = req.body;

      if (!fullname) throw { name: "FullNameRequired" };
      if (!username) throw { name: "UsernameRequired" };
      if (!email) throw { name: "EmailRequired" };
      if (!password) throw { name: "PassRequired" };

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
        preference: ""
      };

      const user = await User.createOne(newUser);
      newUser._id = user.insertedId;

      res.status(201).json({ message: "user created" });
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
  static async updatePreference(req, res, next) {
    try {
      const userId = req.user._id
      const { preference } = req.body;

      if (!preference) throw { name: "PreferRequired" };

      const newPrefer = {
        preference,
      };

      await User.updatePrefer(userId, newPrefer);

      res.status(201).json({newPrefer});
      
    } catch (error) {
      next(error);
    }
  }

  // Controller User
  static async userProfile(req, res, next) {
    try {
      const userId = req.user._id

      const result = await User.findPostById(userId);

      res.status(200).json(result);
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

      await redis.del("posts");

      res.status(200).json({ message: "Post created", newPost });
    } catch (error) {
      next(error);
    }
  }
  static async listPost(req, res, next) {
    try {
      const redisPost = await redis.get("posts");
      if (redisPost) {
        console.log("from redis");
        const data = JSON.parse(redisPost);
        res.status(200).json(data);
      } else {
        const posts = await Post.findAll();
        await redis.set("posts", JSON.stringify(posts));
        res.status(200).json(posts);
      }
    } catch (error) {
      next(error);
    }
  }
  static async postByUserId(req, res, next) {
    try {
      const {id} = req.params;

      const result = await User.findPostById(id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  static async likePost(req, res, next) {
    try {
      const {id} = req.params;
      const username = req.user.username;

      await Post.updateOne(
        id, { like: [username] }
      )
      await redis.del("posts");

      res.status(200).json({ message: "Post liked" });
    } catch (error) {
      next(error);
    }
  }

  // Controller Maps
  static async maps(req, res, next) {
    const { textQuery } = req.body;
    const options = {
      method: "POST",
      url: `https://places.googleapis.com/v1/places:searchText`,
      headers: {
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.priceLevel,places.googleMapsUri,places.photos",
      },
      data: {
        textQuery,
      },
    };
    try {
      const { data } = await axios.request(options);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  // AI Controller
  static async ai(req, res, next) {
    const { input } = req.body;
    const options = {
      method: "POST",
      url: "https://open-ai21.p.rapidapi.com/conversationgpt35",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": process.env.AI_KEY,
        "X-RapidAPI-Host": process.env.AI_HOST,
      },
      data: {
        messages: [
          {
            role: "user",
            content: input,
          },
        ],
        web_access: false,
        system_prompt: "",
        temperature: 0.9,
        top_k: 5,
        top_p: 0.9,
        max_tokens: 256,
      },
    };
    try {
      const {
        data: { result },
      } = await axios.request(options);
      res.status(200).json({ result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
