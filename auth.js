/* auth.js — shared Supabase auth helpers, loaded on every page.
   Requires the Supabase UMD script to be loaded first (see <head> of each HTML file).

   Public config (SUPABASE_URL + SUPABASE_ANON_KEY) is loaded at runtime
   from the `/api/config` serverless endpoint so nothing sensitive/hardcoded
   ends up in the deployed static bundle. The anon key is safe to expose —
   Row Level Security is the real boundary. */

window.LF = window.LF || {};

// Any page-load code that needs Supabase should `await LF.ready` first.
LF.ready = (async function init() {
  const res = await fetch('/api/config', { credentials: 'same-origin' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('LeadFlow config error:', err.error || res.status);
    throw new Error(err.error || 'Could not load app config.');
  }
  const { supabaseUrl, supabaseAnonKey } = await res.json();
  const sb = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  LF.client = sb;
  return sb;
})();

LF.signUp = async function (name, email, password) {
  const sb = await LF.ready;
  return sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/onboarding.html`,
    },
  });
};

LF.signIn = async function (email, password) {
  const sb = await LF.ready;
  return sb.auth.signInWithPassword({ email, password });
};

LF.signInWithGoogle = async function () {
  const sb = await LF.ready;
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/onboarding.html` },
  });
};

LF.forgotPassword = async function (email) {
  const sb = await LF.ready;
  return sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`,
  });
};

LF.signOut = async function () {
  const sb = await LF.ready;
  await sb.auth.signOut();
  window.location.href = '/index.html';
};

LF.getSession = async function () {
  const sb = await LF.ready;
  const { data } = await sb.auth.getUser();
  return data.user || null;
};

LF.getProfile = async function (userId) {
  const sb = await LF.ready;
  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
};

// Toggle a password input between hidden/visible. Pass the input's id and the
// toggle button element itself.
LF.togglePassword = function (inputId, btn) {
  const el = document.getElementById(inputId);
  const isHidden = el.type === 'password';
  el.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? 'Hide' : 'Show';
};

// Guard used at the top of dashboard.html — redirects to onboarding if the
// person isn't signed in, or to the pricing step if they haven't paid yet.
// This check is a UX convenience only; the real enforcement lives server-side
// in every /api/* function, which re-verifies subscription_status itself.
LF.requireActiveSubscription = async function () {
  await LF.ready;
  const user = await LF.getSession();
  if (!user) {
    window.location.href = '/onboarding.html';
    return null;
  }
  const profile = await LF.getProfile(user.id);
  if (!profile || profile.subscription_status !== 'active') {
    window.location.href = '/onboarding.html?step=pricing';
    return null;
  }
  return { user, profile };
};
