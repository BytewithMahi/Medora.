// test_api.js
async function testAI() {
  console.log("=== Testing AI Fraud Detection ===");
  try {
    const res1 = await fetch('http://localhost:5000/api/ai-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failedAttempts: 3, duplicateScans: 2, unusualActivity: true })
    });
    console.log(await res1.json());

    console.log("\n=== Testing Geo-Location Risk ===");
    const res2 = await fetch('http://localhost:5000/api/geo-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 35.6895, longitude: 139.6917, history: [] })
    });
    console.log(await res2.json());

    console.log("\n=== Testing Authenticity Score ===");
    const res3 = await fetch('http://localhost:5000/api/authenticity-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationScore: 90, fraudScore: 1, geoRiskLevel: 'low', supplyChainValidity: 100 })
    });
    console.log(await res3.json());

    console.log("\n=== Testing Demand Prediction ===");
    const res4 = await fetch('http://localhost:5000/api/predict-demand/MED-101');
    console.log(await res4.json());

  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

testAI();
