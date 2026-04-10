const { supabase } = require('../services/db/supabaseService');
const { sendReportEmail } = require('../services/emailService');

const DEFAULT_ADMIN_EMAIL = 'v1-medora-admin@gmail.com';

const submitReport = async (req, res) => {
    try {
        const { batchNo, issueType, description, reporterEmail } = req.body;

        if (!batchNo || !issueType || !description || !reporterEmail) {
            return res.status(400).json({ success: false, error: 'Missing required report fields' });
        }

        // 1. Fetch the medicine ID from batchNo
        const { data: medData, error: medError } = await supabase
            .from('medicines')
            .select('id')
            .eq('batch_no', batchNo)
            .single();

        if (medError || !medData) {
            return res.status(404).json({ success: false, error: 'Batch not found on ledger' });
        }

        const medicineId = medData.id;

        // 2. Determine target role and fetch target email from ledger_events
        let targetRole = '';
        let targetName = '';
        let targetEmail = '';

        switch (issueType) {
            case 'fake':
                targetRole = 'Producer Initialization';
                targetName = 'Manufacturer';
                break;
            case 'supply':
                targetRole = 'Distributor Verification';
                targetName = 'Distributor';
                break;
            case 'tampering':
                targetRole = 'Retailer Verification';
                targetName = 'Retailer';
                break;
            default:
                targetRole = 'Admin';
                targetName = 'System Admin';
                targetEmail = DEFAULT_ADMIN_EMAIL;
        }

        if (targetRole !== 'Admin') {
            const { data: eventData, error: eventError } = await supabase
                .from('ledger_events')
                .select('actor_email')
                .eq('medicine_id', medicineId)
                .eq('role', targetRole)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (eventError || !eventData) {
                console.warn(`Could not find ${targetRole} for batch ${batchNo}. Routing to Admin.`);
                targetEmail = DEFAULT_ADMIN_EMAIL;
                targetName = 'System Admin (Escalated)';
            } else {
                targetEmail = eventData.actor_email;
            }
        }

        // 3. Send the email
        const result = await sendReportEmail({
            to: targetEmail,
            roleName: targetName,
            issueType,
            batchNo,
            description,
            reporterEmail
        });

        if (result.success) {
            return res.json({ success: true, message: `Report successfully routed to ${targetName}` });
        } else {
            return res.status(500).json({ success: false, error: 'Failed to send report email', details: result.error });
        }

    } catch (error) {
        console.error("submitReport error:", error);
        res.status(500).json({ success: false, error: 'An internal error occurred while processing the report' });
    }
};

module.exports = { submitReport };
