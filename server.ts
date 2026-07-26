import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import callsStart from './api/calls/start.js';
import leadsIntake from './api/leads/intake.js';
import leadsOutcome from './api/leads/outcome.js';
import paymentsCheckout from './api/payments/checkout.js';
import paymentsWebhook from './api/payments/webhook.js';
import smsSend from './api/sms/send.js';
import smsWebhook from './api/sms/webhook.js';
import twilioVoice from './api/twilio/voice.js';
import whatsappSend from './api/whatsapp/send.js';
import teamInvite from './api/team/invite.js';
import configEndpoint from './api/config.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhooks that need raw body (Dodo Payments)
  app.post('/api/payments/webhook', paymentsWebhook);

  // Parse JSON and URL-encoded bodies for other routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API routes
  app.get('/api/config', configEndpoint);
  app.post('/api/calls/start', callsStart);
  app.post('/api/leads/intake', leadsIntake);
  app.post('/api/leads/outcome', leadsOutcome);
  app.post('/api/payments/checkout', paymentsCheckout);
  app.post('/api/sms/send', smsSend);
  app.post('/api/sms/webhook', smsWebhook);
  app.post('/api/twilio/voice', twilioVoice);
  app.post('/api/whatsapp/send', whatsappSend);
  app.post('/api/team/invite', teamInvite);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "mpa", // Support multi-page applications
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { extensions: ['html'] }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
