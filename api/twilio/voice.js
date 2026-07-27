// api/twilio/voice.js — webhook for incoming calls
import { getServiceClient } from '../../lib/supabaseServer.js';
import { sendSms } from '../../lib/twilio.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/xml');

  try {
    const from = req.body.From;
    const to = req.body.To;
    
    // We expect Twilio phone number in "To".
    // Need to find which business owns this number. 
    // Wait, the business hasn't provisioned a per-business Twilio number in this simple version, 
    // it's a shared Twilio number.
    // If it's a shared number, we can't reliably map inbound calls to a business profile unless they called from a known lead's phone.
    // Let's look up if this 'from' number exists as a lead.
    
    const svc = getServiceClient();
    
    const { data: lead } = await svc
      .from('leads')
      .select('*')
      .eq('phone', from)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lead) {
      // It's a known lead. Let's send a missed call text back.
      const { data: profile } = await svc.from('profiles').select('business_name').eq('id', lead.user_id).single();
      const msg = `Hi, this is ${profile?.business_name || 'our team'}. Sorry we missed your call! How can we help you?`;
      await sendSms(from, msg);
      await svc.from('lead_messages').insert({ lead_id: lead.id, user_id: lead.user_id, direction: 'outbound', body: msg });
      
      return res.status(200).send('<Response><Reject reason="busy"/></Response>');
    }

    // If it's not a known lead, we don't know whose missed call it is because it's a shared number.
    // In a full multi-tenant system, we'd provision a Twilio number per user and look it up by "To".
    // For now, just reject.
    return res.status(200).send('<Response><Reject reason="busy"/></Response>');
    
  } catch (err) {
    console.error(err);
    return res.status(200).send('<Response></Response>');
  }
}
