// api/calls/missed.js — Twilio Voice webhook that answers any incoming
// call, plays a short spoken message, then automatically sends a
// follow-up SMS ("missed-call text-back") to the caller so no lead is
// ever dropped when the business owner can't pick up.
//
// In Twilio Console → your phone number → Voice "A call comes in"
// webhook → https://your-domain.vercel.app/api/calls/missed  (POST)
const { getServiceClient } = require('../../lib/supabaseServer');
const { sendSms } = require('../../lib/twilio');
const { runQualifyingStep } = require('../../lib/ai');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'text/xml');

  const from = (req.body && req.body.From) || req.query.From;
  const to = (req.body && req.body.To) || req.query.To;

  // Speak a short message to the caller so they know they'll get a text back.
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thanks for calling. We just sent you a text so we can help you right away.</Say>
</Response>`;

  // Fire-and-forget: create a lead + send the first qualifying SMS.
  // We don't await this before returning TwiML so Twilio sees a fast response.
  (async () => {
    try {
      if (!from || !to) return;
      const svc = getServiceClient();

      // Match the business that owns the Twilio number that was called.
      // Businesses configure their own Twilio number in Settings, stored in
      // profiles.twilio_phone_number (column added by the schema patch).
      const { data: profile } = await svc
        .from('profiles')
        .select('*')
        .eq('twilio_phone_number', to)
        .maybeSingle();

      // Fallback: if no per-business number is stored, use the first
      // active account so a solo owner setup still works out of the box.
      let ownerProfile = profile;
      if (!ownerProfile) {
        const { data: first } = await svc
          .from('profiles')
          .select('*')
          .eq('subscription_status', 'active')
          .limit(1)
          .maybeSingle();
        ownerProfile = first;
      }
      if (!ownerProfile) return;

      const { data: lead } = await svc
        .from('leads')
        .insert({
          user_id: ownerProfile.id,
          name: 'Missed call',
          phone: from,
          source: 'missed_call',
          status: 'contacted',
        })
        .select()
        .single();

      const step = await runQualifyingStep({
        industryKey: ownerProfile.industry || 'other',
        businessName: ownerProfile.business_name || 'our team',
        bookingLink: ownerProfile.booking_link,
        conversation: [],
      });

      try {
        await sendSms(from, step.reply);
      } catch (err) {
        console.warn('Missed-call SMS send failed:', err.message);
      }

      if (lead) {
        await svc.from('lead_messages').insert({
          lead_id: lead.id,
          user_id: ownerProfile.id,
          direction: 'outbound',
          body: step.reply,
        });
      }
    } catch (err) {
      console.error('Missed-call handler error:', err);
    }
  })();

  return res.status(200).send(twiml);
};
