/* api/whatsapp/send.js — POST /api/whatsapp/send — "Send WhatsApp" button. */

const { supabaseAdmin } = require('../../lib/supabaseAdmin');
const { verifyUser } = require('../../lib/verifyUser');
const { twilioClient } = require('../../lib/twilio');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { leadId, message } = req.body || {};
  if (!leadId || !message) return res.status(400).json({ error: 'leadId and message are required.' });

  const db = supabaseAdmin();
  const { data: lead } = await db.from('leads').select('*').eq('id', leadId).eq('user_id', user.id).maybeSingle();
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  if (lead.opted_out) return res.status(400).json({ error: 'This lead has opted out of messages.' });

  try {
    const client = twilioClient();
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${lead.phone}`,
      body: message,
    });
    await db.from('lead_messages').insert({
      lead_id: lead.id,
      user_id: user.id,
      direction: 'outbound',
      channel: 'whatsapp',
      body: message,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Twilio WhatsApp error:', err.message);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Check your Twilio WhatsApp setup.' });
  }
};
