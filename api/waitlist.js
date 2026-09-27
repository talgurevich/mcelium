import { timingSafeEqual } from 'node:crypto';
import { db } from './_db.js';

// Export signups as CSV:
//   curl -H "Authorization: Bearer $ADMIN_TOKEN" https://mcelium.dev/api/waitlist > waitlist.csv
export default async function handler(req, res) {
  const token = process.env.ADMIN_TOKEN;
  const given = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!token || !safeEqual(given, token)) {
    return res.status(401).json({ error: 'Missing or wrong admin token.' });
  }

  const sql = await db();
  const rows = await sql`select * from waitlist order by created_at`;
  const cols = ['created_at', 'email', 'source', 'country', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign'];
  const esc = (v) => (v == null ? '' : `"${String(v instanceof Date ? v.toISOString() : v).replace(/"/g, '""')}"`);
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Total-Count', String(rows.length));
  return res.status(200).send(csv + '\n');
}

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
