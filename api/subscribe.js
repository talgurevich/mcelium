import { db } from './_db.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v, n = 300) => (typeof v === 'string' ? v.slice(0, n) : null) || null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const email = String(body.email || '').trim().toLowerCase();

  // Bots fill the hidden "company" field; accept silently and store nothing.
  if (body.company) return res.status(200).json({ ok: true });

  if (!EMAIL.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Enter an email address like you@company.com.' });
  }

  try {
    const sql = await db();
    await sql`
      insert into waitlist (email, source, referrer, utm_source, utm_medium, utm_campaign, country)
      values (${email}, ${clip(body.source, 40)}, ${clip(body.referrer)}, ${clip(body.utm_source, 100)},
              ${clip(body.utm_medium, 100)}, ${clip(body.utm_campaign, 100)}, ${clip(req.headers['x-vercel-ip-country'], 8)})
      on conflict (email) do nothing`;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('subscribe failed', err);
    return res.status(500).json({ error: 'Something went wrong on our side. Try again in a minute.' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
