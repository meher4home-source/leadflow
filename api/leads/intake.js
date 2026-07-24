/* api/leads/intake.js — POST /api/leads/intake
   Two ways in:
     1) Dashboard "+ Add Lead" button — Authorization: Bearer <token>
     2) A client's own website contact form — ?key=<profile.intake_key>
   Creates the lead, then immediately fires the first qualifying SMS. */

const { supabaseAdmin } = require('../../lib/supabaseAdmin');
const { verifyUser } = require('../../lib/verifyUser');
const { twilioClient } = require('../../lib/twilio');
const { INDUSTRY_QUESTIONS } = require('../../lib/groq');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabaseAdmin();
  let userId = null;
  let source = 'website';

  const user = await verifyUser(req);
  if (user) {
    userId = user.id;
    source = req.body.source === 'manual' ? 'manual' : 'website';
  } else if (req.query.key) {
    const { data: profileByKey } = await db
      .from('profiles')
      .select('id')
      .eq('intake_key', req.query.key)
      .maybeSingle();
    if (!profileByKey) return res.status(401).json({ error: 'Invalid intake key.' });
    userId = profileByKey.id;
    source = 'website';
  } else {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, phone, email } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });

  const { data: profile } = await db.from('profiles').select('*').eq('id', userId).single();
  if (!profile || profile.subscription_status !== 'active') {
    return res.status(403).json({ error: 'This account does not have an active subscription.' });
  }

  const { data: lead, error } = await db
    .from('leads')
    .insert({ user_id: userId, name, phone, email: email || null, source, status: 'new' })
    .select()
    .single();
  if (error) {
    console.error('Lead insert error:', error.message);
    return res.status(500).json({ error: 'Could not create lead.' });
  }

  // Fire the first qualifying question right away — this is the "responds
  // within minutes" promise. Wrapped so a Twilio hiccup doesn't lose the lead.
  try {
    const questions = INDUSTRY_QUESTIONS[profile.industry] || INDUSTRY_QUESTIONS.other;
    const firstQuestion = questions[0];
    const greeting = `Hi ${String(name).split(' ')[0]}, thanks for reaching out to ${profile.business_name || 'us'}! ${firstQuestion}`;

    const client = twilioClient();
    await client.messages.create({ from: process.env.TWILIO_PHONE_NUMBER, to: phone, body: greeting });

    await db.from('lead_messages').insert({
      lead_id: lead.id,
      user_id: userId,
      direction: 'outbound',
      channel: 'sms',
      body: greeting,
    });
    await db.from('leads').update({ status: 'contacted' }).eq('id', lead.id);
  } catch (smsErr) {
    console.error('Could not send first qualifying SMS:', smsErr.message);
    // Lead is still saved even if the first SMS fails to send.
  }

  return res.status(200).json({ success: true, lead });
};
