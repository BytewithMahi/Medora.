const { MailtrapClient } = require('mailtrap');
require('dotenv').config();

const TOKEN = process.env.MAILTRAP_API_KEY;
const client = new MailtrapClient({ token: TOKEN });

const SENDER_EMAIL = "hello@demomailtrap.com"; // Mailtrap demo sender
const SENDER_NAME = "Medora Platform";

/**
 * Sends a structured report email using Mailtrap.
 * @param {string} to - Destination email address.
 * @param {string} roleName - Name of the role being contacted (e.g. "Manufacturer").
 * @param {string} issueType - Type of issue (fake, supply, tampering, other).
 * @param {string} batchNo - The medicine batch number.
 * @param {string} description - Detailed description of the issue.
 * @param {string} reporterEmail - Email of the person reporting.
 */
const sendReportEmail = async ({ to, roleName, issueType, batchNo, description, reporterEmail }) => {
    
    const recipients = [{ email: to }];
    
    try {
        const result = await client.send({
            from: { email: SENDER_EMAIL, name: SENDER_NAME },
            to: recipients,
            subject: `[URGENT] Medora Integrity Report: ${issueType} - Batch ${batchNo}`,
            text: `Hi ${roleName},\n\nWe are from the MedoraTeam. A participant has reported an issue related to ${issueType} for Batch Number: ${batchNo}.\n\nIssue Details:\n"${description}"\n\nPlease cross-check the ledger journey and internal records for this batch immediately.\n\nRegards,\nMedoraTeam`,
            category: "Integrity Report",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #ef4444;">[URGENT] Medora Integrity Report</h2>
                    <p>Hi <b>${roleName}</b>,</p>
                    <p>We are from the <b>MedoraTeam</b>. A participant has reported a <b>${issueType}</b> issue for medicine batch: <br/>
                    <code style="background: #f4f4f4; padding: 5px 10px; border-radius: 4px; font-size: 1.2em;">${batchNo}</code></p>
                    
                    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">Report Details:</p>
                        <p style="margin: 5px 0;">"${description}"</p>
                    </div>

                    <p>We demand an immediate cross-check of the ledger journey and your internal production/logistics records for this batch.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.9em; color: #666;">Regards,<br/><b>MedoraTeam</b></p>
                    <p style="font-size: 0.8em; color: #999;">Reported by: ${reporterEmail}</p>
                </div>
            `,
        });

        console.log('Mailtrap success:', result);
        return { success: true, messageId: result.message_id };
    } catch (error) {
        console.error('Mailtrap Error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendReportEmail };
