// chat-widget.js — Embeddable snippet
(function() {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '999999';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  const btn = document.createElement('button');
  btn.innerText = 'Chat with us';
  btn.style.background = '#4F46E5';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.padding = '14px 24px';
  btn.style.borderRadius = '100px';
  btn.style.cursor = 'pointer';
  btn.style.fontWeight = '600';
  btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

  const chatBox = document.createElement('div');
  chatBox.style.display = 'none';
  chatBox.style.width = '320px';
  chatBox.style.background = '#fff';
  chatBox.style.border = '1px solid #e5e7eb';
  chatBox.style.borderRadius = '12px';
  chatBox.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
  chatBox.style.marginBottom = '12px';
  chatBox.style.overflow = 'hidden';

  chatBox.innerHTML = `
    <div style="background:#4F46E5;color:white;padding:16px;font-weight:600;display:flex;justify-content:space-between">
      <span>Get an instant quote</span>
      <span id="lf-close-btn" style="cursor:pointer">✕</span>
    </div>
    <div style="padding:16px" id="lf-form-area">
      <p style="font-size:14px;color:#4b5563;margin-top:0;margin-bottom:16px">Drop your details and we'll text you right away.</p>
      <input type="text" id="lf-name" placeholder="Your Name" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;">
      <input type="tel" id="lf-phone" placeholder="Your Phone Number" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;">
      <p style="font-size:11px;color:#9ca3af;margin-bottom:16px">By submitting, you agree we may contact you by call or text, including by automated system.</p>
      <button id="lf-submit-btn" style="width:100%;background:#4F46E5;color:white;padding:10px;border:none;border-radius:6px;font-weight:600;cursor:pointer">Send</button>
    </div>
    <div style="padding:24px;text-align:center;display:none" id="lf-success-area">
      <div style="font-size:24px;margin-bottom:8px">✅</div>
      <p style="font-weight:600;margin:0">Check your phone!</p>
      <p style="font-size:13px;color:#4b5563">We just sent you a text.</p>
    </div>
  `;

  container.appendChild(chatBox);
  container.appendChild(btn);
  document.body.appendChild(container);

  btn.addEventListener('click', () => {
    chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('lf-close-btn').addEventListener('click', () => {
    chatBox.style.display = 'none';
  });

  document.getElementById('lf-submit-btn').addEventListener('click', async () => {
    const name = document.getElementById('lf-name').value;
    const phone = document.getElementById('lf-phone').value;
    if(!name || !phone) return alert('Please enter name and phone.');

    // We look for a data attribute on the script tag to get the intake key
    const scriptTag = document.currentScript || document.querySelector('script[src*="chat-widget.js"]');
    const key = scriptTag ? scriptTag.getAttribute('data-key') : '';

    const btnSub = document.getElementById('lf-submit-btn');
    btnSub.innerText = 'Sending...';
    btnSub.disabled = true;

    try {
      // In a real embed, this URL would be absolute.
      const domain = new URL(scriptTag.src).origin;
      const res = await fetch(domain + '/api/leads/intake?key=' + key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, source: 'website' })
      });
      if(res.ok) {
        document.getElementById('lf-form-area').style.display = 'none';
        document.getElementById('lf-success-area').style.display = 'block';
      } else {
        alert('Could not submit. Please try again later.');
        btnSub.innerText = 'Send';
        btnSub.disabled = false;
      }
    } catch(err) {
      alert('Network error.');
      btnSub.innerText = 'Send';
      btnSub.disabled = false;
    }
  });

})();
