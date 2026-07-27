// api/team/invite.js
import { getUserFromToken, getServiceClient } from '../../lib/supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not signed in.' });

  try {
    const token = authHeader.replace('Bearer ', '');
    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Not signed in.' });

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required.' });

    const svc = getServiceClient();
    
    const { data: profile } = await svc.from('profiles').select('plan').eq('id', user.id).single();
    if (profile?.plan !== 'multilocation') {
      return res.status(403).json({ error: 'Team invites require the Multi-Location plan.' });
    }

    // Insert into team_members
    const { data: teamMember, error } = await svc.from('team_members').insert({
      owner_id: user.id,
      email: email,
      status: 'invited'
    }).select().single();
    
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Team member already invited.' });
      }
      throw error;
    }

    // In a real app we'd call Supabase Auth admin to send an invite email:
    // await svc.auth.admin.inviteUserByEmail(email)
    
    return res.status(200).json({ success: true, teamMember });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
