/* api/payments/webhook.js — Dodo Payments webhook (see README Step 4.4).
   This is the single source of truth for subscription_status — nothing the
   browser sends can activate an account. Signature verification uses the
   raw request body, so automatic JSON body-parsing is disabled below. */

const DodoPaymentsModule = require('dodopayments');
const DodoPayments = DodoPaymentsModule.default || DodoPaymentsModule;
const { supabaseAdmin } = require('../../lib/supabaseAdmin');

module.exports.config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const ACTIVE_EVENTS = ['subscription.active', 'subscription.renewed'];
const INACTIVE_EVENTS = ['subscription.cancelled', 'subscription.canceled', 'subscription.expired', 'subscription.failed'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const rawBody = await getRawBody(req);

  const client = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode',
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  });

  let event;
  try {
    event = client.webhooks.unwrap(rawBody, {
      headers: {
        'webhook-id': req.headers['webhook-id'],
        'webhook-signature': req.headers['webhook-signature'],
        'webhook-timestamp': req.headers['webhook-timestamp'],
      },
    });
  } catch (err) {
    console.error('Dodo webhook signature invalid:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Acknowledge immediately (Dodo times out at 15s) — process after.
  res.status(200).json({ received: true });

  try {
    await handleEvent(event);
  } catch (err) {
    console.error('Dodo webhook processing error:', err.message);
  }
};

async function handleEvent(event) {
  const type = event.type;
  const data = event.data || {};

  if (!ACTIVE_EVENTS.includes(type) && !INACTIVE_EVENTS.includes(type)) {
    console.log('Unhandled Dodo webhook event type:', type);
    return;
  }

  const db = supabaseAdmin();
  const profile = await findProfile(db, data);
  if (!profile) {
    console.error('Dodo webhook: no matching profile for', type, JSON.stringify(data.customer || {}));
    return;
  }

  if (ACTIVE_EVENTS.includes(type)) {
    const plan =
      data.product_id === process.env.DODO_PRODUCT_MULTILOCATION ? 'multilocation' :
      data.product_id === process.env.DODO_PRODUCT_STANDARD ? 'standard' :
      profile.plan;
    await db.from('profiles').update({
      subscription_status: 'active',
      plan,
      dodo_customer_id: data.customer?.customer_id || profile.dodo_customer_id,
    }).eq('id', profile.id);
  } else {
    await db.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', profile.id);
  }
}

// Tries metadata.user_id first (set at checkout creation), then falls back
// to matching by customer email, then by a previously-stored Dodo customer id.
async function findProfile(db, data) {
  const userId = data.metadata?.user_id;
  if (userId) {
    const { data: byId } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (byId) return byId;
  }
  const email = data.customer?.email;
  if (email) {
    const { data: byEmail } = await db.from('profiles').select('*').ilike('email', email).maybeSingle();
    if (byEmail) return byEmail;
  }
  const customerId = data.customer?.customer_id;
  if (customerId) {
    const { data: byCustomer } = await db.from('profiles').select('*').eq('dodo_customer_id', customerId).maybeSingle();
    if (byCustomer) return byCustomer;
  }
  return null;
}
