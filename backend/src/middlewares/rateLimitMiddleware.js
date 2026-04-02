const rateLimit = require('express-rate-limit');

// General API Rate Limiting to prevent brute-force or DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limits for AI processing (requires more resources)
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // max 20 ai requests per 5 minutes
  message: {
    success: false,
    error: 'AI capability rate limit exceeded'
  }
});

module.exports = { apiLimiter, aiLimiter };
