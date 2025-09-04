const {getBrokerHoldings, getAllAssets, getAllBrokerHoldings, getConsolidatedHoldings, deleteAsset, placeBrokerOrder, manageManualAsset} = require("../controllers/broker.controller");
const {loginAngelOne, loginDhan, loginUpstox} = require("../controllers/brokerAuth.controller");
const {Router} = require("express");
const verifyJWT = require("../middlewares/auth");

const router = new Router();

router.use(verifyJWT);

router.post('/login/angelone', loginAngelOne);
router.post('/login/dhan', loginDhan);
router.post('/login/upstox', loginUpstox);


router.get('/holdings/:brokerId', getBrokerHoldings);
router.get('/getAllAssets', getAllAssets);
router.get('/getAllBrokerHoldings', getAllBrokerHoldings);
router.get('/getConsolidatedHoldings', getConsolidatedHoldings);

router.delete('/deleteAsset/:assetId', deleteAsset);
router.post('/manageManualAsset', manageManualAsset);

router.post('/order', placeBrokerOrder);

module.exports = router;
