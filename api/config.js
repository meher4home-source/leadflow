// api/config.js
export default function handler(req, res) {
  res.json({
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
  });
}
