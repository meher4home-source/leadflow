// api/leads/outcome.js
import { getUserFromToken, getUserClient } from '../../lib/supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not signed in.' });

  try {
    const token = authHeader.replace('Bearer ', '');
    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Not signed in.' });

    const { leadId, outcome } = req.body || {};
    if (!leadId || !outcome) return res.status(400).json({ error: 'leadId and outcome are required.' });
    if (!['converted', 'not_converted'].includes(outcome)) return res.status(400).json({ error: 'invalid outcome' });

    const db = getUserClient(token);
    const { data: lead } = await db.from('leads').select('*').eq('id', leadId).single();
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    await db.from('leads').update({ outcome, status: 'closed', updated_at: new Date().toISOString() }).eq('id', leadId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
