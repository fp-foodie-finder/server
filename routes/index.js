const express = require('express');
const Controller = require('../controllers/controller');
const authentication = require('../middlewares/authentication');
const router = express.Router()

// CRUD login/register
router.post("/register", Controller.register);
router.post("/login", Controller.login)

module.exports = router
