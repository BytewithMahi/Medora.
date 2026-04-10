const express = require('express');
const router = express.Router();
const { getTradeStatus, createTrade } = require('../controllers/tradeController');

router.get('/status', getTradeStatus);
router.post('/create', createTrade);

module.exports = router;
