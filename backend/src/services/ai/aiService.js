const { GoogleGenAI } = require('@google/genai');

/**
 * Analyze verification data and detect fraud using a Real Large Language Model
 * Requires GEMINI_API_KEY in .env
 */
const detectFraud = async (verificationData) => {
  const { failedAttempts = 0, duplicateScans = 0, unusualActivity = false } = verificationData;

  // Let's use the True AI model if the API key is configured
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are an expert Anti-Counterfeit Supply Chain AI.
        Analyze this medicine batch activity:
        - Failed Attempts: ${failedAttempts}
        - Duplicate Scans (Different IPs): ${duplicateScans}
        - Unusual Activity Detected: ${unusualActivity}

        Rules:
        1. Calculate a fraud_score from 0.0 to 5.0 (0=safe, 5=certain fraud).
        2. Assign a risk_level of 'low', 'medium', or 'high'.

        Return ONLY a JSON object exactly like this:
        {"fraud_score": number, "risk_level": "string"}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
      });
      
      const parsedText = response.text;
      return JSON.parse(parsedText);
    } catch (err) {
      console.error('LLM API Error, falling back to algorithmic evaluation:', err.message);
    }
  }

  // Fallback Algorithmic scoring if no API key is provided
  let fraud_score = 0;
  if (failedAttempts >= 2) fraud_score += 1.5;
  if (failedAttempts >= 5) fraud_score += 1.5;
  if (duplicateScans >= 1) fraud_score += 1.5;
  if (duplicateScans >= 3) fraud_score += 1.0;
  if (unusualActivity) fraud_score += 1.0;
  
  fraud_score = Math.min(fraud_score, 5);
  let risk_level = fraud_score > 3.5 ? 'high' : fraud_score >= 1.5 ? 'medium' : 'low';

  return { fraud_score: parseFloat(fraud_score.toFixed(1)), risk_level };
};

module.exports = { detectFraud };
