# mcelium.dev

Waitlist landing page for Mcelium.

- `public/` is the static site (HTML, CSS, JS and assets), served as-is by Vercel.
- `api/subscribe.js` takes waitlist signups (`POST /api/subscribe`) and stores them in Postgres.
- `api/waitlist.js` exports signups as CSV for an admin.
- `brand/` holds the logo files.

## Setup on Vercel

1. Import this repo in Vercel. No build settings are needed.
2. In the project's Storage tab, add a Neon Postgres database. It sets `DATABASE_URL`, and the `waitlist` table is created on the first signup.
3. Add an `ADMIN_TOKEN` environment variable (any long random string) to enable the export.
4. Add the `mcelium.dev` domain in the project's Domains settings.

## Export signups

```sh
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://mcelium.dev/api/waitlist > waitlist.csv
```

The `X-Total-Count` response header holds the number of signups.
