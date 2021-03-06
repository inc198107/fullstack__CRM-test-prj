const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/logout', controller.logout);

module.exports = router;