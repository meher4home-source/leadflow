// api/payments/webhook.js — Dodo Payments calls this when a payment/subscription
// event happens. Signature verification is what makes this trustworthy; nobody
// can fake a webhook call without Dodo's actual signing secret. This is the
// ONLY code path allowed to set subscription_status = 'active'.
import { Webhook } from 'standardwebhooks';
import { getServiceClient } from '../../lib/supabaseServer.js';

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const rawBody = await readRawBody(req);
    const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY);
    const webhookHeaders = {
      'webhook-id': req.headers['webhook-id'] || '',
      'webhook-signature': req.headers['webhook-signature'] || '',
      'webhook-timestamp': req.headers['webhook-timestamp'] || '',
    };
    await webhook.verify(rawBody, webhookHeaders);

    const payload = JSON.parse(rawBody);
    const svc = getServiceClient();

    const eventType = payload.type;
    const data = payload.data || {};
    const userId = data.metadata?.supabase_user_id;
    const plan = data.metadata?.plan === 'multilocation' ? 'multilocation' : 'standard';

    if (['subscription.active', 'subscription.renewed', 'payment.succeeded'].includes(eventType) && userId) {
      const { data: existingProfile } = await svc.from('profiles').select('dodo_customer_id, referred_by').eq('id', userId).single();
      
      await svc
        .from('profiles')
        .update({ plan, subscription_status: 'active', dodo_customer_id: data.customer?.customer_id || null })
        .eq('id', userId);

      // Handle referral credit for first-time activation
      if (existingProfile && !existingProfile.dodo_customer_id && existingProfile.referred_by) {
        // Increment the referrer's credits by 1
        // Since Supabase RPC isn't defined here, we can do a read-modify-write as a simple fallback
        const { data: referrer } = await svc.from('profiles').select('id, referral_credits').eq('referral_code', existingProfile.referred_by).single();
        if (referrer) {
          await svc.from('profiles').update({ referral_credits: (referrer.referral_credits || 0) + 1 }).eq('id', referrer.id);
        }
      }
    }

    if (['subscription.cancelled', 'subscription.expired', 'subscription.failed'].includes(eventType) && userId) {
      await svc.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', userId);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }
}
