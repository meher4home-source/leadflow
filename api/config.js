// api/config.js — public runtime config for the browser.
// Reads the public Supabase URL and anon key from Vercel env vars so
// nothing has to be hardcoded in auth.js. The anon key is safe to expose;
// Row Level Security is the real boundary.

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  const url = process.env.SUPABASE_URL || '';
  const anon = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anon) {
    return res.status(500).json({
      error:
        'Supabase env vars missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in your Vercel project settings.',
    });
  }
  return res.status(200).json({ supabaseUrl: url, supabaseAnonKey: anon });
};
