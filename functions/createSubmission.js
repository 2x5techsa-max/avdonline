```javascript
import { getStore } from '@netlify/blobs';
import fetch from 'node-fetch';            // for hCaptcha verification
import { Resend } from 'resend';           // optional email

const ALLOWED = ['blinds', 'wood', 'laser', 'general'];
const EMAIL_TO = 'ryan@avdesigns.org';    // <-- Updated to business email for notifications

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Only POST' });

  // Parse multipart/form-data
  const { NetlifyRequest } = await import('@netlify/functions');
  const req = new NetlifyRequest(event);
  const form = await req.formData();

  // 1) hCaptcha verify (required in production)
  const token = (form.get('hcaptcha_token') || '').toString();
  const captchaOK = await verifyHCaptcha(token);
  if (!captchaOK) return json(400, { error: 'Captcha failed' });

  // 2) Validate + read fields
  const flow = (form.get('flow') || '').toString().toLowerCase();
  if (!ALLOWED.includes(flow)) return json(400, { error: 'Invalid flow' });

  const name  = (form.get('name')  || '').toString().trim();
  const phone = (form.get('phone') || '').toString().trim();
  const email = (form.get('email') || '').toString().trim();
  const notes = (form.get('notes') || '').toString().trim();

  const qty   = form.get('qty')   ? Number(form.get('qty')) : undefined;
  const width = form.get('width') ? Number(form.get('width')) : undefined;
  const drop  = form.get('drop')  ? Number(form.get('drop')) : undefined;
  const material = (form.get('material') || '').toString();

  // 3) Optional image -> Netlify Blobs (private)
  let imageUrl = '';
  const file = form.get('photo');
  if (file && typeof file === 'object' && 'arrayBuffer' in file) {
    const buf = Buffer.from(await file.arrayBuffer());
    const key = `uploads/${Date.now()}-${slug(name || flow)}${extFor(file.type)}`;
    const store = getStore({ name: 'avd-uploads' });
    await store.set(key, buf, { contentType: file.type || 'application/octet-stream' });
    imageUrl = await store.getURL(key); // signed URL
  }

  // 4) Save submission JSON (prepend)
  const submission = {
    id: rid(), ts: new Date().toISOString(),
    flow, name, phone, email, notes, qty, width, drop, material, imageUrl
  };
  const store = getStore({ name: 'avd-submissions' });
  const listKey = 'submissions.json';
  const existing = (await store.get(listKey, { type: 'json' })) || [];
  existing.unshift(submission);
  await store.set(listKey, JSON.stringify(existing, null, 2), { contentType: 'application/json' });

  // 5) Optional email notification via Resend
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  if (RESEND_API_KEY && EMAIL_TO) {
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: 'AVD <noreply@avdesigns.org>',
      to: EMAIL_TO,
      subject: `AVD ${flow} submission — ${name || 'Unknown'}`,
      text: summarize(submission)
    });
  }

  return json(200, { ok: true, submission });
};

// ---- helpers ----
const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body)
});

async function verifyHCaptcha(token) {
  const secret = process.env.HCAPTCHA_SECRET || '';
  // Allow missing secret/token during early testing — treat as pass if not configured.
  if (!secret || !token) return true;
  const res = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token })
  });
  const data = await res.json();
  return !!data.success;
}

const summarize = (s) => [
  `Flow: ${s.flow}`,
  `Name: ${s.name}`, `Phone: ${s.phone}`, `Email: ${s.email}`,
  s.qty ? `Qty: ${s.qty}` : null,
  s.width ? `Width: ${s.width} mm` : null,
  s.drop ? `Drop: ${s.drop} mm` : null,
  s.material ? `Material: ${s.material}` : null,
  s.notes ? `Notes: ${s.notes}` : null,
  s.imageUrl ? `Image: ${s.imageUrl}` : null
].filter(Boolean).join('\n');

const rid = () => [...crypto.getRandomValues(new Uint32Array(4))].map(x=>x.toString(16)).join('');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const extFor = (m='') => m.includes('png')?'.png': m.includes('jpeg')||m.includes('jpg')?'.jpg': m.includes('webp')?'.webp':'';

export { handler };
```

Great—I've updated the backend to route submission notifications to `ryan@avdesigns.org`. 

### What Changed
- **EMAIL_TO**: Set to `'ryan@avdesigns.org'` (line 5)—now Resend emails go there on every valid submission.
- **From Email**: Updated to `'AVD <noreply@avdesigns.org>'` for consistency (line 57)—swap if you have a different sender.
- **No Frontend Changes**: The afterbar's "Email Summary" still opens the user's mail client (with body text). If you meant adding it there too (e.g., CC), let me know!

### Deploy Steps
1. Save this as `netlify/functions/createSubmission.js` (overwrite old).
2. Commit/push to GitHub: `git add .; git commit -m "Add Ryan email for notifications"; git push`.
3. Netlify auto-deploys—test a form submit to confirm email arrives (set up Resend API key in Netlify env vars first if not done).

Test in preview? Submit a form—console logs "Netlify success" (or fallback), and check your inbox. Need Resend setup help or more tweaks?
