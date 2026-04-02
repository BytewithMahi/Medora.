const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { apiLimiter, aiLimiter } = require('../middlewares/rateLimitMiddleware');

// Validations
const { aiCheckSchema, geoRiskSchema, authenticitySchema } = require('../utils/validation');

// Controllers
const { 
  handleAiCheck, 
  handlePredictDemand, 
  handleGeoRisk, 
  handleAuthenticityScore 
} = require('../controllers/aiController');

const { 
  verifyBatch, 
  scanQR, 
  getHistory,
  verifyAction
} = require('../controllers/verifyController');

const router = express.Router();

// Apply General Rate Limiter default
router.use(apiLimiter);

/** 
 * Verification Routes
 */
// Public endpoints (could also require auth depends on usecase)
router.post('/verify-batch', verifyBatch);
router.post('/verify-action', verifyAction);
router.post('/scan-qr', scanQR);

// Protected endpoints
router.get('/history/:userId', requireAuth, getHistory);

/**
 * AI / Intelligence Routes
 * These endpoints enforce stricter rate limits to prevent brute forcing models
 */
router.post('/ai-check', aiLimiter, validate(aiCheckSchema), handleAiCheck);
router.post('/geo-risk', aiLimiter, validate(geoRiskSchema), handleGeoRisk);
router.post('/authenticity-score', aiLimiter, validate(authenticitySchema), handleAuthenticityScore);
router.get('/predict-demand/:medicineId', aiLimiter, handlePredictDemand);

// Export master API Router
module.exports = router;
