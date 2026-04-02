const { supabase } = require('../services/db/supabaseService');
const { calculateAuthenticityScore } = require('../services/ai/authenticityService');
const { detectFraud } = require('../services/ai/aiService');
const { detectGeoRisk } = require('../services/ai/geoRiskService');

const verifyBatch = async (req, res) => {
  try {
    const { batchId, qrToken, answersScore, latitude, longitude } = req.body;
    
    // Fetch medicine batch from the actual Supabase DB
    const { data: batchData, error: batchError } = await supabase
      .from('medicines')
      .select('*')
      .eq('batch_no', batchId)
      .single();

    if (batchError || !batchData) {
      return res.status(404).json({ success: false, error: 'Batch not found on MedChain ledger' });
    }

    // Baseline validation Score logic:
    let verificationScore = answersScore || 100;

    // Simulate getting scan history for risk checks
    const failedAttempts = batchData.qr_token !== qrToken ? 1 : 0;
    const scanCount = batchData.scan_count || 0;
    
    const fraudData = await detectFraud({ failedAttempts, duplicateScans: scanCount > 1 ? scanCount : 0, unusualActivity: scanCount > 20 });
    const geoData = await detectGeoRisk(latitude, longitude, []);
    
    const authenticity = calculateAuthenticityScore({
      verificationScore,
      fraudScore: fraudData.fraud_score,
      geoRiskLevel: geoData.risk_level,
      supplyChainValidity: 100 // Blockchain record found successfully
    });

    return res.json({
      success: true,
      data: {
        batchId,
        medicineDetails: {
          name: batchData.name,
          status: batchData.status
        },
        verificationStatus: authenticity.status,
        authenticityScore: authenticity.authenticity_score,
        scannedLocationRisk: geoData.risk_level
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Batch verification failed' });
  }
};

const scanQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    const extractedBatchId = qrData.split('/').pop();
    
    return res.json({
      success: true,
      data: {
        extractedBatchId,
        message: 'QR successfully parsed'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to extract batch ID' });
  }
};

const getHistory = async (req, res) => {
  try {
    // We treat userId as the `email` identifier based on frontend schema
    const { userId } = req.params; 
    
    const { data, error } = await supabase
      .from('ledger_events')
      .select('*')
      .eq('actor_email', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve scan history from DB' });
  }
};

const verifyAction = async (req, res) => {
  try {
    const { batchId, role, answers, location, actorEmail, actorPhone } = req.body;

    // Fetch medicine batch
    const { data: batchData, error: batchError } = await supabase
      .from('medicines')
      .select('*')
      .eq('batch_no', batchId)
      .single();

    if (batchError || !batchData) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Insert new ledger event
    const nextStatus = role === 'Distributor Verification' ? 'in_transit' : 
                       role === 'Retailer Verification' ? 'at_retailer' : 
                       role === 'Consumer Scan' ? 'verified_by_consumer' : 'created';

    const { error: eventError } = await supabase
      .from('ledger_events')
      .insert([{
          medicine_id: batchData.id,
          role,
          status: 'verified',
          details: answers || {},
          location: location || null,
          actor_email: actorEmail || 'ops@medchain.net',
          actor_phone: actorPhone || '+1-555-SCAN'
      }]);

    if (eventError) {
      throw eventError;
    }

    if (role !== 'Consumer Scan') {
      await supabase.from('medicines').update({ status: nextStatus }).eq('id', batchData.id);
    }

    return res.json({
      success: true,
      data: { status: 'success' }
    });

  } catch (error) {
    console.error("verifyAction error:", error);
    res.status(500).json({ success: false, error: 'Verification action failed' });
  }
};

module.exports = {
  verifyBatch,
  verifyAction,
  scanQR,
  getHistory
};
