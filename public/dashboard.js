/* dashboard.js — sidebar nav, stats, lead lists, calls/WhatsApp, settings */

let _profile = null;
let _allLeads = [];
let _currentFilter = 'all';

const PAGE_INFO = {
  dashboard: { title: 'Dashboard', sub: 'Overview of your leads' },
  leads: { title: 'All Leads', sub: 'Every lead, all statuses' },
  calls: { title: 'Calls & WhatsApp', sub: 'Reach out to your leads directly' },
  settings: { title: 'Settings', sub: 'Manage your business and account' },
};

function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelectorAll('.sb-item[data-tab]').forEach((b) => {
    b.classList.toggle('act', b.dataset.tab === tab);
  });
  document.getElementById('pageTitle').textContent = PAGE_INFO[tab].title;
  document.getElementById('pageSub').textContent = PAGE_INFO[tab].sub;
  if (tab === 'calls') populateToolSelects();
}

function badgeFor(classification) {
  if (classification === 'high_paying') return { cls: 'badge-high', text: 'High-Paying' };
  if (classification === 'mid_range') return { cls: 'badge-mid', text: 'Mid-Range' };
  if (classification === 'low_budget') return { cls: 'badge-low', text: 'Low-Budget' };
  return { cls: 'badge-low', text: 'Pending' };
}

function statusLabel(status) {
  const map = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed' };
  return map[status] || status;
}

function leadRowHtml(lead) {
  const badge = badgeFor(lead.classification);
  return `
    <div class="lead-row" onclick="openLeadDetail('${lead.id}')">
      <div style="flex:1">
        <div class="lead-name">${escapeHtml(lead.name)}</div>
        <div class="lead-meta">${escapeHtml(lead.phone)} · ${statusLabel(lead.status)}</div>
      </div>
      <span class="badge ${badge.cls}">${badge.text}</span>
      <span class="lead-value">${lead.estimated_value ? '$' + Number(lead.estimated_value).toLocaleString() : '—'}</span>
    </div>`;
}

function renderDashboardTab() {
  const recent = _allLeads.slice(0, 8);
  const el = document.getElementById('dashLeadsList');
  el.innerHTML = recent.length ? recent.map(leadRowHtml).join('') : '<div class="empty">No leads yet. Add one to see LeadFlow in action.</div>';

  const formatDollars = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const highSum = _allLeads.filter(l => l.classification === 'high_paying').reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
  const midSum = _allLeads.filter(l => l.classification === 'mid_range').reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
  const lowSum = _allLeads.filter(l => l.classification === 'low_budget').reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
  
  document.getElementById('statHigh').textContent = formatDollars(highSum);
  document.getElementById('statMid').textContent = formatDollars(midSum);
  document.getElementById('statLow').textContent = formatDollars(lowSum);
  document.getElementById('statTotal').textContent = _allLeads.length;

  const highCount = _allLeads.filter((l) => l.classification === 'high_paying' && l.status !== 'closed').length;
  const badgeEl = document.getElementById('highBadge');
  if (highCount > 0) {
    badgeEl.style.display = 'inline-block';
    badgeEl.textContent = highCount;
  } else {
    badgeEl.style.display = 'none';
  }
}

async function renderAnalyticsTab() {
  const formatDollars = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  
  const convertedLeads = _allLeads.filter(l => l.outcome === 'converted');
  const totalRevenue = convertedLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
  
  const closedLeads = _allLeads.filter(l => l.outcome === 'converted' || l.outcome === 'not_converted');
  const convRate = closedLeads.length ? Math.round((convertedLeads.length / closedLeads.length) * 100) : 0;
  
  document.getElementById('anConverted').textContent = convertedLeads.length;
  document.getElementById('anRevenue').textContent = formatDollars(totalRevenue);
  document.getElementById('anRate').textContent = convRate + '%';

  // Calculate actual response time
  let totalTimeMs = 0;
  let count = 0;
  if (_allLeads.length > 0) {
    const { data: msgs } = await LF.client.from('lead_messages').select('lead_id, created_at').eq('direction', 'outbound').order('created_at', { ascending: true });
    if (msgs && msgs.length > 0) {
      const firstMsgs = {};
      msgs.forEach(m => {
        if (!firstMsgs[m.lead_id]) firstMsgs[m.lead_id] = new Date(m.created_at).getTime();
      });
      _allLeads.forEach(l => {
        if (firstMsgs[l.id]) {
          const leadTime = new Date(l.created_at).getTime();
          const diff = firstMsgs[l.id] - leadTime;
          if (diff > 0) {
            totalTimeMs += diff;
            count++;
          }
        }
      });
    }
  }

  let displayTime = '—';
  if (count > 0) {
    const avgSecs = Math.round((totalTimeMs / count) / 1000);
    if (avgSecs < 60) displayTime = avgSecs + 's';
    else displayTime = (avgSecs / 60).toFixed(1) + 'm';
  }

  document.getElementById('anTime').textContent = displayTime;
}

function filterLeads(filter) {
  _currentFilter = filter;
  document.querySelectorAll('.filter-btn[data-filter]').forEach((b) => {
    b.classList.toggle('act', b.dataset.filter === filter);
  });
  renderLeadsTab();
}

function renderLeadsTab() {
  const el = document.getElementById('leadsList');
  const leads = _currentFilter === 'all' ? _allLeads : _allLeads.filter((l) => l.classification === _currentFilter);
  el.innerHTML = leads.length ? leads.map(leadRowHtml).join('') : '<div class="empty">No leads in this category yet.</div>';
}

async function loadLeads(userId) {
  const { data } = await LF.client
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  _allLeads = data || [];
  renderDashboardTab();
  renderLeadsTab();
  await renderAnalyticsTab();
}

async function openLeadDetail(leadId) {
  const lead = _allLeads.find((l) => l.id === leadId);
  if (!lead) return;
  const btns = document.getElementById('outcomeBtns');
  if (lead.outcome) {
    btns.style.display = 'none';
  } else {
    btns.style.display = 'flex';
  }
  // store current leadId somewhere globally for the outcome function
  window._currentLeadId = leadId;
  await LFChat.open(lead);
}

async function markLeadOutcome(outcome) {
  if (!window._currentLeadId) return;
  const { res, data } = await authedFetch('/api/leads/outcome', { leadId: window._currentLeadId, outcome });
  if (!res.ok) return alert(data.error || 'Failed to mark outcome');
  closeModal('leadDetailOverlay');
  await loadLeads(_profile.id);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function openAddLead() {
  document.getElementById('addLeadOverlay').classList.add('open');
}

async function submitAddLead() {
  const name = document.getElementById('newLeadName').value.trim();
  const phone = document.getElementById('newLeadPhone').value.trim();
  const email = document.getElementById('newLeadEmail').value.trim();
  if (!name || !phone) {
    document.getElementById('addLeadErr').innerHTML = '<div class="msg-box msg-error">Name and phone are required.</div>';
    return;
  }
  const { data: sessionData } = await LF.client.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch('/api/leads/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, phone, email, source: 'manual' }),
  });
  const data = await res.json();
  if (!res.ok) {
    document.getElementById('addLeadErr').innerHTML = `<div class="msg-box msg-error">${data.error || 'Could not add lead.'}</div>`;
    return;
  }
  closeModal('addLeadOverlay');
  document.getElementById('newLeadName').value = '';
  document.getElementById('newLeadPhone').value = '';
  document.getElementById('newLeadEmail').value = '';
  await loadLeads(_profile.id);
}

async function sendManualMessage() {
  const input = document.getElementById('manualMsg');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  await LFChat.send(message);
}

async function saveSettings() {
  const business_name = document.getElementById('setBizName').value.trim();
  const booking_link = document.getElementById('setBooking').value.trim();
  const webhook_url = document.getElementById('setWebhookUrl').value.trim();
  await LF.client.from('profiles').update({ business_name, booking_link, webhook_url }).eq('id', _profile.id);
  document.getElementById('bizNameTag').textContent = business_name;
}

async function inviteTeamMember() {
  const email = document.getElementById('inviteEmail').value.trim();
  if (!email) return document.getElementById('teamInviteErr').innerHTML = '<div class="msg-box msg-error">Email is required.</div>';
  const { res, data } = await authedFetch('/api/team/invite', { email });
  if (!res.ok) return document.getElementById('teamInviteErr').innerHTML = `<div class="msg-box msg-error">${data.error || 'Could not invite.'}</div>`;
  document.getElementById('teamInviteErr').innerHTML = '<div class="msg-box msg-info">Invitation sent.</div>';
  document.getElementById('inviteEmail').value = '';
  await loadTeamMembers();
}

async function loadTeamMembers() {
  if (_profile.plan !== 'multilocation') return;
  const { data } = await LF.client.from('team_members').select('*').eq('owner_id', _profile.id).order('invited_at', { ascending: false });
  const el = document.getElementById('teamList');
  el.innerHTML = data && data.length ? data.map(m => `
    <div style="padding:16px 20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
      <div><div style="font-weight:600;font-size:13.5px">${escapeHtml(m.email)}</div><div style="font-size:11.5px;color:var(--muted)">Invited: ${new Date(m.invited_at).toLocaleDateString()}</div></div>
      <span class="badge ${m.status === 'active' ? 'badge-high' : 'badge-mid'}">${m.status}</span>
    </div>
  `).join('') : '<div class="empty">No team members invited yet.</div>';
}

function copyIntakeUrl() {
  const text = document.getElementById('intakeUrl').textContent;
  navigator.clipboard.writeText(text);
  alert('Copied!');
}

/* ── Calls & WhatsApp ── */
function populateToolSelects() {
  const options = _allLeads.map((l) => `<option value="${l.id}">${escapeHtml(l.name)} — ${escapeHtml(l.phone)}</option>`).join('');
  document.getElementById('callLeadSelect').innerHTML = options || '<option>No leads yet</option>';
  document.getElementById('waLeadSelect').innerHTML = options || '<option>No leads yet</option>';
}

function toolsMsg(html) {
  document.getElementById('toolsMsg').innerHTML = html;
}

async function authedFetch(url, body) {
  const { data: sessionData } = await LF.client.auth.getSession();
  const token = sessionData.session?.access_token;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { res, data: await res.json() };
}

async function startCall() {
  const leadId = document.getElementById('callLeadSelect').value;
  const yourPhone = document.getElementById('callYourPhone').value.trim();
  if (!leadId || !yourPhone) return toolsMsg('<div class="msg-box msg-error">Select a lead and enter your phone number.</div>');
  toolsMsg('<div class="msg-box msg-info">Calling your phone now — stay on the line to be connected...</div>');
  const { res, data } = await authedFetch('/api/calls/start', { leadId, yourPhone });
  if (!res.ok) return toolsMsg(`<div class="msg-box msg-error">${data.error || 'Could not start the call.'}</div>`);
  toolsMsg('<div class="msg-box msg-info">Call started — answer your phone to connect.</div>');
}

async function sendWhatsApp() {
  const leadId = document.getElementById('waLeadSelect').value;
  const message = document.getElementById('waMessage').value.trim();
  if (!leadId || !message) return toolsMsg('<div class="msg-box msg-error">Select a lead and write a message.</div>');
  const { res, data } = await authedFetch('/api/whatsapp/send', { leadId, message });
  if (!res.ok) return toolsMsg(`<div class="msg-box msg-error">${data.error || 'Could not send WhatsApp message.'}</div>`);
  toolsMsg('<div class="msg-box msg-info">WhatsApp message sent.</div>');
  document.getElementById('waMessage').value = '';
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function waitForActivationIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') !== 'success') return;
  const user = await LF.getSession();
  if (!user) return;
  for (let i = 0; i < 15; i++) {
    const profile = await LF.getProfile(user.id);
    if (profile && profile.subscription_status === 'active') return;
    await new Promise((r) => setTimeout(r, 2000));
  }
}

(async function init() {
  await waitForActivationIfNeeded();

  const result = await LF.requireActiveSubscription();
  if (!result) return;
  _profile = result.profile;

  document.getElementById('bizNameTag').textContent = _profile.business_name || '';
  document.getElementById('userNameTag').textContent = _profile.full_name || _profile.business_name || 'Account';
  document.getElementById('userAvatar').textContent = (_profile.full_name || _profile.business_name || '?').charAt(0).toUpperCase();
  document.getElementById('userPlanTag').textContent = _profile.plan === 'multilocation' ? 'Multi-Location Plan' : 'Standard Plan';

  document.getElementById('setBizName').value = _profile.business_name || '';
  document.getElementById('setBooking').value = _profile.booking_link || '';
  document.getElementById('setWebhookUrl').value = _profile.webhook_url || '';
  document.getElementById('referralCode').textContent = `${window.location.origin}/?ref=${_profile.referral_code}`;

  if (_profile.plan === 'multilocation') {
    document.getElementById('navTeam').style.display = 'flex';
    await loadTeamMembers();
  }
  document.getElementById('setPlanText').textContent =
    _profile.plan === 'multilocation' ? 'Multi-Location — $4,997/month' : 'Standard — $1,997/month';
  document.getElementById('intakeUrl').textContent =
    `${window.location.origin}/api/leads/intake?key=${_profile.intake_key}`;

  await loadLeads(_profile.id);
})();
