// api/payments/webhook.js — Dodo Payments calls this when a payment/subscription
// event happens. Signature verification is what makes this trustworthy; nobody
// can fake a webhook call without Dodo's actual signing secret. This is the
// ONLY code path allowed to set subscription_status = 'active'.
const { Webhook } = require('standardwebhooks');
const { getServiceClient } = require('../../lib/supabaseServer');

// Raw body is required for signature verification, so automatic body parsing
// is disabled for this function.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
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
      await svc
        .from('profiles')
        .update({ plan, subscription_status: 'active', dodo_customer_id: data.customer?.customer_id || null })
        .eq('id', userId);
    }

    if (['subscription.cancelled', 'subscription.expired', 'subscription.failed'].includes(eventType) && userId) {
      await svc.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', userId);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }
};
