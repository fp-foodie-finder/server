const express = require("express");
const Controller = require("../controllers/controller");
const authentication = require("../middlewares/authentication");
const router = express.Router();

// Home
router.get("/", Controller.home);

// CRUD login/register
router.post("/register", Controller.register);
router.post("/login", Controller.login);

// CRUD Post
router.post("/post", authentication, Controller.createPost);
router.get("/post", authentication, Controller.listPost);
router.get("/post/:id", authentication, Controller.postByUserId);
router.put("/like/:id", authentication, Controller.likePost);
router.put("/unlike/:id", authentication, Controller.unlikePost);
router.put("/dislike/:id", authentication, Controller.dislikePost);
router.delete("/post/:id", authentication, Controller.deletePost);

// CRUD Favorite
router.post("/favorite/:idx", authentication, Controller.addFavorite);
router.get("/favorite", authentication, Controller.listFavorite);
router.delete("/favorite/:id", authentication, Controller.deleteFavorite);

// CRUD User
router.get("/user", authentication, Controller.userProfile);
router.put("/user/:id", authentication, Controller.updatePreference);

// Google Maps API
router.post("/maps", Controller.maps);

// AI API
router.post("/ai", Controller.ai);

module.exports = router;
