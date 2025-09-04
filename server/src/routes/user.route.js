const { Router } = require("express");
const { Register, login, logout, verifyEmail } = require("../controllers/user.controller");
const verifyJWT = require("../middlewares/auth");

const router = new Router();

router.route('/register').post(Register)
router.route('/verifyuser').post(verifyEmail)
router.route('/login').post(login)
router.route('/logout').post(verifyJWT , logout)

module.exports = router;