/* auth.js — shared Supabase auth helpers, loaded on every page.
   Requires the Supabase UMD script to be loaded first (see <head> of each HTML file). */

window.LF = window.LF || {};
LF.client = null;

LF.init = async function () {
  if (LF.client) return LF.client;

  let SUPABASE_URL = 'https://wcdsopdmijqhznkbycjf.supabase.co';
  let SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZHNvcGRtaWpxaHpua2J5Y2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNDQ5NTMsImV4cCI6MjEwMDgyMDk1M30.TYhTTvxyXSdVz2HfxyObuSIlOrONXQroUtKYsAchCDU';

  try {
    if (typeof process !== 'undefined' && process.env) {
      SUPABASE_URL = process.env.VITE_SUPABASE_URL || SUPABASE_URL;
      SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
    }
  } catch (e) {}

  if (SUPABASE_URL && SUPABASE_URL.startsWith('http')) {
    LF.client = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
    if (LF.client) return LF.client;
  }

  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    SUPABASE_URL = config.SUPABASE_URL;
    SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
    LF.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return LF.client;
  } catch(e) {
    console.error('Failed to init Supabase client', e);
  }
}

LF.signUp = async function (name, email, password) {
  await LF.init();
  return LF.client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/onboarding.html`,
    },
  });
};

LF.signIn = async function (email, password) {
  await LF.init();
  return LF.client.auth.signInWithPassword({ email, password });
};

LF.signInWithGoogle = async function () {
  await LF.init();
  return LF.client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/onboarding.html` },
  });
};

LF.forgotPassword = async function (email) {
  await LF.init();
  return LF.client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`,
  });
};

LF.signOut = async function () {
  await LF.init();
  await LF.client.auth.signOut();
  window.location.href = '/index.html';
};

LF.getSession = async function () {
  await LF.init();
  const { data } = await LF.client.auth.getUser();
  return data.user || null;
};

LF.getProfile = async function (userId) {
  await LF.init();
  const { data } = await LF.client
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
