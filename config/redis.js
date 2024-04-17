require('dotenv').config();

const Redis = require('ioredis');
const redis = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    username: "default",
    password: process.env.REDIS_PASS,
    db: 0,
});

module.exports = redis;