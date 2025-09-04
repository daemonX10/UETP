const { Router } = require("express");
const { login, fetchHoldings, executeTrade, cancelOrder, modifyOrder, fetchOrderBook, fetchTradeBook } = require("../controllers/angelone.controller");
// const verifyJWT = require("../middlewares/auth");

const router = new Router();

router.route('/login').post(login)
router.route('/getallholdings').post(fetchHoldings)
router.route('/placeorder').post(executeTrade)
router.route('/modifyorder').post(modifyOrder)
router.route('/cancelorder').post(cancelOrder)
router.route('/getorderbook').post(fetchOrderBook)
router.route('/gettradebook').post(fetchTradeBook)

module.exports = router;