const express = require('express');
const Controller = require('../controllers/controller');
const authentication = require('../middlewares/authentication');
const router = express.Router()

// CRUD login/register
router.post("/register", Controller.register);
router.post("/login", Controller.login)

// CRUD Post
router.post("/post", authentication, Controller.createPost);
router.get("/post", authentication, Controller.listPost);
router.get("/post/:id", authentication, Controller.postByUserId);

module.exports = router
