/* api/calls/start.js — POST /api/calls/start — "Start Call" button in
   Calls & WhatsApp. Calls yourPhone first; once answered, Dial bridges in
   the lead's number. */

const { supabaseAdmin } = require('../../lib/supabaseAdmin');
const { verifyUser } = require('../../lib/verifyUser');
const { twilioClient } = require('../../lib/twilio');

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { leadId, yourPhone } = req.body || {};
  if (!leadId || !yourPhone) return res.status(400).json({ error: 'leadId and yourPhone are required.' });

  const db = supabaseAdmin();
  const { data: lead } = await db.from('leads').select('*').eq('id', leadId).eq('user_id', user.id).maybeSingle();
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });

  try {
    const client = twilioClient();
    const twiml = `<Response><Say>Connecting you to ${escapeXml(lead.name)}.</Say><Dial callerId="${process.env.TWILIO_PHONE_NUMBER}">${lead.phone}</Dial></Response>`;
    await client.calls.create({ to: yourPhone, from: process.env.TWILIO_PHONE_NUMBER, twiml });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Twilio call error:', err.message);
    return res.status(500).json({ error: 'Could not start the call. Check your Twilio setup.' });
  }
};
