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

// Google Maps API
router.post("/maps", Controller.maps);

module.exports = router;
