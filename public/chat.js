/* chat.js — conversation thread (SMS exchange) for a single lead */

window.LFChat = window.LFChat || {};
let _currentLeadId = null;

LFChat.open = async function (lead) {
  _currentLeadId = lead.id;
  document.getElementById('leadDetailName').textContent = lead.name;
  document.getElementById('leadDetailMeta').textContent =
    `${lead.phone} · ${classificationLabel(lead.classification)}${lead.estimated_value ? ' · Est. $' + Number(lead.estimated_value).toLocaleString() : ''}`;

  const { data: messages } = await LF.client
    .from('lead_messages')
    .select('*')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: true });

  LFChat.renderThread(messages || []);
  document.getElementById('leadDetailOverlay').classList.add('open');
};

LFChat.renderThread = function (messages) {
  const el = document.getElementById('leadThread');
  if (!messages.length) {
    el.innerHTML = '<p style="font-size:12.5px;color:var(--muted);text-align:center">No messages yet — LeadFlow will reach out shortly.</p>';
    return;
  }
  el.innerHTML = messages
    .map((m) => `<div class="bubble ${m.direction === 'outbound' ? 'out' : 'in'}">${escapeHtml(m.body)}</div>`)
    .join('');
  el.scrollTop = el.scrollHeight;
};

LFChat.send = async function (message) {
  if (!_currentLeadId || !message.trim()) return;
  const { data: sessionData } = await LF.client.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch('/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ leadId: _currentLeadId, message }),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Could not send message. Check your Twilio setup.');
    return;
  }
  const { data: messages } = await LF.client
    .from('lead_messages')
    .select('*')
    .eq('lead_id', _currentLeadId)
    .order('created_at', { ascending: true });
  LFChat.renderThread(messages || []);
};

function classificationLabel(c) {
  if (c === 'high_paying') return 'High-Paying Lead';
  if (c === 'mid_range') return 'Mid-Range Lead';
  if (c === 'low_budget') return 'Low-Budget Lead';
  return 'Pending Qualification';
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
