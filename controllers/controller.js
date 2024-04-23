const { ObjectId } = require("bson");
const { comparePassword, hashPassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const User = require("../models/user");
const Post = require("../models/post");
const redis = require("../config/redis");
const axios = require("axios");
const Favorite = require("../models/favorite");

class Controller {
  // Controller Home
  static async home(req, res, next) {
    res.status(200).json({ message: "Welcome to our api" });
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
        preference: "",
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

      res
        .status(200)
        .json({ message: "login success", token, user: { _id: user._id } });
    } catch (error) {
      next(error);
    }
  }
  static async updatePreference(req, res, next) {
    try {
      const userId = req.user._id;
      const { preference } = req.body;

      if (!preference) throw { name: "PreferRequired" };

      const newPrefer = {
        preference,
      };

      await User.updatePrefer(userId, newPrefer);

      res.status(201).json({ newPrefer });
    } catch (error) {
      next(error);
    }
  }

  // Controller User
  static async userProfile(req, res, next) {
    const userId = req.user._id;

    const result = await User.findPostById(userId);

    res.status(200).json(result);
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
    const redisPost = await redis.get("posts");
    if (redisPost) {
      const data = JSON.parse(redisPost);

      await redis.del("posts");
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(data);
    } else {
      const posts = await Post.findAll();
      await redis.set("posts", JSON.stringify(posts));

      res.status(200).json(posts);
    }
  }
  static async postByUserId(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) throw { name: "NotFound" };
      const result = await User.findPostById(id);

      await redis.del("posts");

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  static async likePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      await Post.updateOne(id, { like: userId });
      await redis.del("posts");

      res.status(200).json({ message: "Post liked", userId });
    } catch (error) {
      next(error);
    }
  }
  static async unlikePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      await Post.updateUnlike(id, { like: userId });
      await redis.del("posts");

      res.status(200).json({ message: "Post unliked", userId });
    } catch (error) {
      next(error);
    }
  }
  static async dislikePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      await Post.updateOne(id, { dislike: userId });
      await redis.del("posts");

      res.status(200).json({ message: "Post disliked", userId });
    } catch (error) {
      next(error);
    }
  }
  static async undislikePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      await Post.updateUnlike(id, { dislike: userId });
      await redis.del("posts");

      res.status(200).json({ message: "Post undisliked", userId });
    } catch (error) {
      next(error);
    }
  }
  static async deletePost(req, res, next) {
    try {
      const { id } = req.params;

      await Post.deletePost(id);
      await redis.del("posts");

      res.status(200).json({ message: "Post deleted" });
    } catch (error) {
      next(error);
    }
  }

  // Controller Favorite
  static async addFavorite(req, res, next) {
    const { textQuery } = req.body;
    const { idx } = req.params;

    const options = {
      method: "POST",
      url: `https://places.googleapis.com/v1/places:searchText`,
      headers: {
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.priceLevel,places.googleMapsUri,places.photos,places.rating",
      },
      data: {
        textQuery,
      },
    };
    try {
      const { data } = await axios.request(options);
      const userId = new ObjectId(String(req.user._id));

      if (
        !data.places ||
        data.places.length === 0 ||
        idx < 0 ||
        idx >= data.places.length
      ) {
        throw { name: "NotFound" };
      }

      const selectedPlace = data.places[idx];
      const dataAddress = selectedPlace.formattedAddress;
      const dataRating = selectedPlace.rating;
      const dataName = selectedPlace.displayName.text;
      const dataImageUrl = selectedPlace.photos[0].name;

      const newFavorite = {
        userId,
        address: dataAddress,
        rating: dataRating,
        name: dataName,
        imageUrl: `https://places.googleapis.com/v1/${dataImageUrl}/media?key=${process.env.GOOGLE_MAPS_API}&maxWidthPx=360`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const fav = await Favorite.addFavorite(newFavorite);
      newFavorite._id = fav.insertedId;

      res.status(200).json({ message: "Favorite added", newFavorite });
    } catch (error) {
      next(error);
    }
  }
  static async listFavorite(req, res, next) {
    const userId = req.user._id;
    const favorite = await Favorite.listFavorite(userId);

    res.status(200).json(favorite);
  }
  static async deleteFavorite(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) throw { message: "NotFound" };
      await Favorite.deleteFavorite(id);

      res.status(200).json({ message: "Favorite deleted" });
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
          "places.displayName,places.formattedAddress,places.priceLevel,places.googleMapsUri,places.photos,places.rating",
      },
      data: {
        textQuery,
      },
    };
    try {
      if (!textQuery) throw { name: "NotFound" };
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
      if (!input) throw { name: "NotFound" };

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
