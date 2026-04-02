const { ZodError } = require('zod');

/**
 * Middleware to validate request params/body against zod schema
 * @param {import('zod').AnyZodObject} schema 
 */
const validate = (schema) => (req, res, next) => {
  try {
    // Sanitizes and validates the incoming request payload using zod
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Replace with sanitized
    req.body = parsed.body || req.body;
    req.query = parsed.query || req.query;
    req.params = parsed.params || req.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        details: error.errors
      });
    }
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { validate };
