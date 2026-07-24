// lib/crm.js — fires an outbound HTTP webhook to a business's CRM
// whenever a lead reaches a qualified status. Multi-Location plan only.
async function fireCrmWebhook(profile, lead) {
  if (!profile || !lead) return;
  if (profile.plan !== 'multilocation') return; // gated to Multi-Location
  const url = profile.crm_webhook_url;
  if (!url) return;

  const payload = {
    event: 'lead.qualified',
    business: {
      id: profile.id,
      name: profile.business_name,
      industry: profile.industry,
    },
    lead: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      classification: lead.classification,
      estimated_value: lead.estimated_value,
      status: lead.status,
      source: lead.source,
    },
    sent_at: new Date().toISOString(),
  };

  try {
    // Fire and forget — never let a slow CRM block the AI conversation.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn('CRM webhook failed:', err.message);
  }
}

module.exports = { fireCrmWebhook };
