const express = require('express');
const router = express.Router();
const { 
    getTradeStatus, 
    createTrade, 
    recordTokenDeployment,
    getManufacturerTokens,
    getTokenHolders
} = require('../controllers/tradeController');

router.get('/status', getTradeStatus);
router.get('/manufacturer-tokens/:address', getManufacturerTokens);
router.get('/token-holders/:tokenAddress', getTokenHolders);
router.post('/create', createTrade);
router.post('/record-deployment', recordTokenDeployment);

module.exports = router;
