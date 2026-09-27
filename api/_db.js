import { neon } from '@neondatabase/serverless';

let sql;
let ready;

// Neon's Vercel integration sets DATABASE_URL; POSTGRES_URL covers older setups.
export function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  sql ??= neon(url);
  ready ??= sql`
    create table if not exists waitlist (
      id bigserial primary key,
      email text not null unique,
      source text,
      referrer text,
      utm_source text,
      utm_medium text,
      utm_campaign text,
      country text,
      created_at timestamptz not null default now()
    )`;
  return ready.then(() => sql);
}
