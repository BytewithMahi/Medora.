/**
 * Calculate authenticity score
 * @param {Object} data
 * @param {number} data.verificationScore - (0-100) How well answers matched DB
 * @param {number} data.fraudScore - (0-5) Output from AI fraud check
 * @param {string} data.geoRiskLevel - 'low', 'medium', 'high'
 * @param {number} data.supplyChainValidity - (0-100) Based on ledger hashes
 * @returns {Object} { authenticity_score, status }
 */
const calculateAuthenticityScore = ({
  verificationScore,
  fraudScore,
  geoRiskLevel,
  supplyChainValidity
}) => {
  // Convert 0-5 fraud score to 0-100 (where 5 fraud = 0 authenticity)
  const normalizedFraudScore = 100 - (fraudScore * 20);
  
  // Transform Geo Risk Enum to numeric weight
  let geoRiskScore = 100; // Low
  if (geoRiskLevel === 'medium') geoRiskScore = 50;
  if (geoRiskLevel === 'high') geoRiskScore = 0;

  // Weighted calculation logic:
  // verification: 40%
  // fraud avoidance: 30%
  // geo safety: 20%
  // supply chain: 10%
  const score = 
    (verificationScore * 0.4) +
    (normalizedFraudScore * 0.3) +
    (geoRiskScore * 0.2) +
    (supplyChainValidity * 0.1);

  const authenticity_score = Math.round(score);
  
  let status = 'Authentic';
  if (authenticity_score < 40) {
    status = 'Fake';
  } else if (authenticity_score < 80) {
    status = 'Suspicious';
  }

  return {
    authenticity_score,
    status
  };
};

module.exports = { calculateAuthenticityScore };
