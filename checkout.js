/* api/payments/checkout.js — POST /api/payments/checkout — "Continue to
   Payment" button in onboarding.js. Creates a Dodo Payments checkout session
   and returns its URL for the browser to redirect to. */

const DodoPaymentsModule = require('dodopayments');
const DodoPayments = DodoPaymentsModule.default || DodoPaymentsModule;
const { supabaseAdmin } = require('../../lib/supabaseAdmin');
const { verifyUser } = require('../../lib/verifyUser');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { plan } = req.body || {};
  const productId = plan === 'multilocation' ? process.env.DODO_PRODUCT_MULTILOCATION : process.env.DODO_PRODUCT_STANDARD;
  if (!productId) return res.status(400).json({ error: 'Unknown plan.' });

  const db = supabaseAdmin();
  // Keep the email on file — the webhook uses it as a fallback to match this
  // Dodo customer back to the right profile if metadata doesn't round-trip.
  await db.from('profiles').update({ email: user.email }).eq('id', user.id);
  const { data: profile } = await db.from('profiles').select('full_name, business_name').eq('id', user.id).maybeSingle();

  try {
    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode',
    });

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email, name: profile?.full_name || profile?.business_name || undefined },
      metadata: { user_id: user.id, plan },
      return_url: `${process.env.SITE_URL}/dashboard.html?checkout=success`,
    });

    return res.status(200).json({ checkout_url: session.checkout_url });
  } catch (err) {
    console.error('Dodo checkout error:', err.message);
    return res.status(500).json({ error: 'Could not start checkout. Check your Dodo Payments setup.' });
  }
};
