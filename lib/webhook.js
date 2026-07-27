// lib/webhook.js — universal webhook firer

export async function fireUniversalWebhook(webhookUrl, event, payload) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() }),
    });
  } catch (err) {
    console.error('Failed to fire webhook:', err.message);
  }
}
