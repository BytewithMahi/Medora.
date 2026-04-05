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
      .limit(1)
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
      .limit(1)
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

    // --- BATCH FLAGGING SYSTEM START ---
    await checkBatchFlags(batchData.id);
    // --- BATCH FLAGGING SYSTEM END ---

    return res.json({
      success: true,
      data: { status: 'success' }
    });

  } catch (error) {
    console.error("verifyAction error:", error);
    res.status(500).json({ success: false, error: 'Verification action failed' });
  }
};

const checkBatchFlags = async (medicineId) => {
  try {
    // 1. Fetch all events for the medicine
    const { data: events, error } = await supabase
      .from('ledger_events')
      .select('*')
      .eq('medicine_id', medicineId)
      .order('created_at', { ascending: true });

    if (error || !events || events.length === 0) return;

    const reasons = [];

    // Identify key nodes
    const mfgNode = events.find(e => e.role === 'Producer Initialization');
    const distNode = events.find(e => e.role === 'Distributor Verification');
    const retailNode = events.find(e => e.role === 'Retailer Verification');
    const consumerNode = events.find(e => e.role === 'Consumer Scan');

    // 1. Sequential Order Check
    if (retailNode) {
      if (!distNode) {
        reasons.push("Sequential anomaly: Retailer verified before Distributor.");
      } else if (new Date(distNode.created_at) > new Date(retailNode.created_at)) {
        reasons.push("Sequential anomaly: Retailer verified before Distributor.");
      }
    }

    if (consumerNode) {
      if (!retailNode) {
        reasons.push("Sequential anomaly: Consumer scanned before Retailer.");
      } else if (new Date(retailNode.created_at) > new Date(consumerNode.created_at)) {
        reasons.push("Sequential anomaly: Consumer scanned before Retailer.");
      }
      
      if (!distNode) {
         reasons.push("Sequential anomaly: Consumer scanned before Distributor.");
      } else if (new Date(distNode.created_at) > new Date(consumerNode.created_at)) {
         reasons.push("Sequential anomaly: Consumer scanned before Distributor.");
      }
    }

    // 2. Time Gap Check (Gap < 12 hours between consecutive events)
    for (let i = 0; i < events.length - 1; i++) {
        const current = new Date(events[i].created_at).getTime();
        const next = new Date(events[i+1].created_at).getTime();
        const gapHours = (next - current) / (1000 * 60 * 60);
        
        if (gapHours < 12) {
          reasons.push(`Suspiciously rapid node transition between ${events[i].role} and ${events[i+1].role} (< 12 hours).`);
        }
    }

    // 3. Location Match Check (Distributor & Retailer)
    if (distNode && retailNode && distNode.location && retailNode.location) {
      const dLoc = distNode.location;
      const rLoc = retailNode.location;
      
      if (dLoc.latitude === rLoc.latitude && dLoc.longitude === rLoc.longitude) {
        reasons.push("Geographic anomaly: Distributor and Retailer locations are identical.");
      }
    }

    // 4. Integrity Questionnaire Check
    events.forEach(evt => {
      const details = evt.details || {};
      const questions = ['batchMatch', 'expiryMatch', 'compositionMatch'];
      
      let isAnyNo = false;
      let isIncomplete = false;

      // Special case for Producer Initialization which uses different keys
      if (evt.role !== 'Producer Initialization') {
        questions.forEach(q => {
          if (details[q] === 'No') isAnyNo = true;
          if (details[q] === null || details[q] === undefined) isIncomplete = true;
        });

        if (isAnyNo) {
          reasons.push(`Integrity failure: "No" recorded at ${evt.role}.`);
        }
        if (isIncomplete) {
          reasons.push(`Integrity warning: Checklist incomplete at ${evt.role}.`);
        }
      }
    });

    // Update medicine record with flags
    const uniqueReasons = reasons.length > 0 ? [...new Set(reasons)].join(' | ') : null;
    await supabase
      .from('medicines')
      .update({ flagged_reasons: uniqueReasons })
      .eq('id', medicineId);

  } catch (err) {
    console.error("checkBatchFlags internal error:", err);
  }
};

module.exports = {
  verifyBatch,
  verifyAction,
  scanQR,
  getHistory
};
