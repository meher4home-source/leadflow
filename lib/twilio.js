// lib/twilio.js — thin wrapper around the Twilio SDK.
const twilio = require('twilio');

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendSms(to, body) {
  const client = getClient();
  return client.messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    body,
  });
}

// Click-to-call: rings the business owner's phone first; once they answer,
// Twilio dials the lead and bridges the two calls together.
async function startBridgedCall(yourPhone, leadPhone) {
  const client = getClient();
  return client.calls.create({
    to: yourPhone,
    from: process.env.TWILIO_PHONE_NUMBER,
    twiml: `<Response><Say>Connecting you now.</Say><Dial>${leadPhone}</Dial></Response>`,
  });
}

async function sendWhatsApp(to, body) {
  const client = getClient();
  return client.messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER}`,
    body,
  });
}

module.exports = { sendSms, startBridgedCall, sendWhatsApp };

