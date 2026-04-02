const { z } = require('zod');

// Input validation using Zod
const aiCheckSchema = z.object({
  body: z.object({
    failedAttempts: z.number().int().min(0).optional(),
    duplicateScans: z.number().int().min(0).optional(),
    unusualActivity: z.boolean().optional()
  }).strict()
});

const geoRiskSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    history: z.array(z.any()).optional()
  })
});

const authenticitySchema = z.object({
  body: z.object({
    verificationScore: z.number().min(0).max(100),
    fraudScore: z.number().min(0).max(5),
    geoRiskLevel: z.enum(['low', 'medium', 'high']),
    supplyChainValidity: z.number().min(0).max(100)
  })
});

module.exports = {
  aiCheckSchema,
  geoRiskSchema,
  authenticitySchema
};
