# Voxy — Client Website & License Portal

A production-ready Next.js 15 (App Router) site for the Voxy Minecraft client: landing page,
Discord-only auth, a licensing/redeem system, a download portal, and an admin panel — all backed
by Supabase.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide Icons
- shadcn-style UI primitives (Radix UI under the hood)
- Supabase (Postgres, Auth, Storage)
- Discord OAuth

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor** and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
   This creates all tables (`profiles`, `admins`, `license_keys`, `licenses`, `downloads`,
   `releases`), triggers, and Row Level Security policies.
3. Open **Storage** and create a new **private** bucket named `client-builds`. This is where the
   actual Voxy `.jar` release files are uploaded. Upload a build, e.g. to
   `releases/1.0.0/voxy.jar`.
4. Insert a matching release row in the SQL editor:

   ```sql
   insert into public.releases (version, changelog, file_path, is_latest)
   values ('1.0.0', '- Initial public release', 'releases/1.0.0/voxy.jar', true);
   ```

## 2. Configure Discord OAuth

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create
   a new application.
2. Under **OAuth2**, copy the **Client ID** and **Client Secret**.
3. Add this redirect URL under **OAuth2 → Redirects**:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. In your Supabase project, go to **Authentication → Providers → Discord**, enable it, and paste
   in the Client ID and Client Secret from Discord.
5. In **Authentication → URL Configuration**, set your **Site URL** to your deployed domain (or
   `http://localhost:3000` while developing) and add both
   `http://localhost:3000/auth/callback` and `https://your-domain.com/auth/callback` to the
   **Redirect URLs** allow list.

## 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from **Supabase → Project
Settings → API**:

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key (**secret**, never expose to the browser) |
| `NEXT_PUBLIC_SITE_URL` | Your site's base URL (`http://localhost:3000` locally) |

These are the **only** three Supabase values you need to wire in — the anon key and URL are safe
to expose (`NEXT_PUBLIC_*`), the service role key must stay server-only and is already only
imported from files marked `import "server-only"`.

## 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 5. Make yourself an admin

After logging in once via Discord (so your `profiles` row exists), find your user id in the
**Table Editor → profiles** table, then run:

```sql
insert into public.admins (user_id)
values ('YOUR-PROFILE-UUID-HERE');
```

You'll now see an **Admin** link in the dashboard nav and can generate/manage license keys at
`/admin`.

## 6. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the same four environment variables from step 3 in the Vercel project settings.
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain, and add
   `https://your-domain.com/auth/callback` to Supabase's redirect URL allow list (step 2.5).
5. Deploy — no further code changes needed.

## How the licensing system works

- Admins generate keys (`VOXY-XXXX-XXXX-XXXX`) for a duration (`14_days`, `30_days`, `lifetime`)
  in `/admin`.
- A user redeems a key at `/dashboard/redeem`. The `/api/redeem` route atomically claims the key
  (`status: unused → redeemed`) using the Supabase **service role** client, then creates a row in
  `licenses` with the computed expiration.
- `/dashboard/download` and `/api/download` re-verify the user has a non-expired active license
  server-side (never trusting any client state) before generating a short-lived signed URL to the
  private `client-builds` storage bucket and logging the download.
- Downloaded files are always named `USERNAME-Voxy.jar`.

## Security notes

- All Supabase mutations that matter (redeeming a key, generating/deleting keys, issuing
  downloads) happen in server-only Route Handlers using the service-role client — the browser
  never has enough permission to fabricate a subscription.
- `middleware.ts` refreshes the Supabase session and redirects unauthenticated users away from
  `/dashboard/*` and `/admin/*`.
- `/admin/*` additionally re-checks `admins` table membership server-side on every request (layout
  + every API route), independent of the middleware redirect.
- Row Level Security is enabled on every table as a defense-in-depth safety net, even though the
  app's own mutations go through the service role key.
