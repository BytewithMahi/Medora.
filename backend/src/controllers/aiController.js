const { detectFraud } = require('../services/ai/aiService');
const { predictDemand } = require('../services/ai/demandService');
const { detectGeoRisk } = require('../services/ai/geoRiskService');
const { calculateAuthenticityScore } = require('../services/ai/authenticityService');

const handleAiCheck = async (req, res) => {
  try {
    const data = req.body;
    const result = await detectFraud(data);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process AI check' });
  }
};

const handlePredictDemand = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { location } = req.query; // optional
    const result = await predictDemand(medicineId, location);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to predict demand' });
  }
};

const handleGeoRisk = async (req, res) => {
  try {
    const { latitude, longitude, history } = req.body;
    const result = await detectGeoRisk(latitude, longitude, history);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assess geo risk' });
  }
};

const handleAuthenticityScore = async (req, res) => {
  try {
    const result = calculateAuthenticityScore(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to calculate authenticity' });
  }
};

module.exports = {
  handleAiCheck,
  handlePredictDemand,
  handleGeoRisk,
  handleAuthenticityScore
};
