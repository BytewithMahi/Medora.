const { GoogleGenAI } = require('@google/genai');

/**
 * Detect high-risk areas for counterfeit activity based on Location
 * Requires GEMINI_API_KEY in .env
 */
const detectGeoRisk = async (latitude, longitude, verificationHistory = []) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are a Supply Chain Intelligence AI. Analyze this geographic anomaly check:
        Coordinates: Latitude ${latitude}, Longitude ${longitude}
        Network Scan History for this target: ${JSON.stringify(verificationHistory)}

        Instructions:
        Predict if these coordinates are an active zone for blackmarket medicine passing.
        Return ONLY a JSON object that exactly matches the following structure:
        {"risk_level": "low" | "medium" | "high", "location_flag": "safe_zone" | "suspicious_activity" | "counterfeit_hotspot" | "near_high_risk_zone"}
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

  // Fallback Rule-based logic
  const highFailureRate = verificationHistory.filter(v => v.status === 'failed' || v.status === 'suspicious').length > 5;
  const frequentScans = verificationHistory.length > 50; 
  
  let risk_level = 'low';
  let location_flag = 'safe_zone';

  if (highFailureRate && frequentScans) {
    risk_level = 'high';
    location_flag = 'counterfeit_hotspot';
  } else if (highFailureRate || frequentScans) {
    risk_level = 'medium';
    location_flag = 'suspicious_activity';
  }

  const anomalyIndicator = Math.random() * 100;
  if (risk_level === 'low' && anomalyIndicator < 15) {
    risk_level = 'medium';
    location_flag = 'near_high_risk_zone';
  }

  return { risk_level, location_flag };
};

module.exports = { detectGeoRisk };
