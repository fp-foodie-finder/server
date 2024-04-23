const express = require("express");
const Controller = require("../controllers/controller");
const authentication = require("../middlewares/authentication");
const router = express.Router();

// Home
router.get("/", Controller.home);

// CRUD login/register
router.post("/register", Controller.register);
router.post("/login", Controller.login);
router.post("/maps", Controller.maps);
router.post("/ai", Controller.ai);
router.get("/user", authentication, Controller.userProfile);
router.get("/favorite", authentication, Controller.listFavorite);
router.post("/post", authentication, Controller.createPost);
router.get("/post", authentication, Controller.listPost);

router.get("/post/:id", authentication, Controller.postByUserId);
router.patch("/like/:id", authentication, Controller.likePost);
router.patch("/unlike/:id", authentication, Controller.unlikePost);
router.patch("/dislike/:id", authentication, Controller.dislikePost);
router.patch("/undislike/:id", authentication, Controller.undislikePost);
router.delete("/post/:id", authentication, Controller.deletePost);
router.post("/favorite/:idx", authentication, Controller.addFavorite);
router.delete("/favorite/:id", authentication, Controller.deleteFavorite);
router.patch("/user/:id", authentication, Controller.updatePreference);

module.exports = router;
