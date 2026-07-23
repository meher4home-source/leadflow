// lib/supabaseServer.js — server-side Supabase client helpers.
const { createClient } = require('@supabase/supabase-js');

// A client scoped to the requesting user's own JWT — Row Level Security
// applies exactly as it would in the browser. Use this for anything a
// user does themselves (adding a lead, sending a manual message).
function getUserClient(accessToken) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}

async function getUserFromToken(accessToken) {
  const client = getUserClient(accessToken);
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user;
}

// Bypasses Row Level Security entirely. ONLY use inside server code that has
// already verified the request through other means (the Dodo Payments
// webhook, or the public lead-intake endpoint after validating intake_key).
function getServiceClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

module.exports = { getUserClient, getUserFromToken, getServiceClient };
