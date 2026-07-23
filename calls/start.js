// api/calls/start.js — rings the business owner's phone, then bridges in the lead.
const { getUserFromToken, getUserClient } = require('../../lib/supabaseServer');
const { startBridgedCall } = require('../../lib/twilio');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not signed in.' });

  try {
    const token = authHeader.replace('Bearer ', '');
    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Not signed in.' });

    const { leadId, yourPhone } = req.body || {};
    if (!leadId || !yourPhone) return res.status(400).json({ error: 'leadId and yourPhone are required.' });

    const db = getUserClient(token);
    const { data: lead } = await db.from('leads').select('*').eq('id', leadId).single();
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    await startBridgedCall(yourPhone, lead.phone);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Could not start the call. Check your Twilio setup.' });
  }
};
