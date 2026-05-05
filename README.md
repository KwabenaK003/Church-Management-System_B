# Church Management System

Next.js App Router + Tailwind CSS front-end, Supabase (PostgreSQL + Auth + Storage) back-end, and Resend-powered emails built with direct Supabase access from client-rendered pages. The public attendance surface lives under `/attendance/[serviceId]`, while the administrator experience lives under `/dashboard` and is guarded by Supabase Auth plus route protection.

## Tech stack
- **Frontend:** Next.js App Router + Tailwind CSS with the mandated blue/white palette
- **Server state / URL state:** TanStack Query + `nuqs`
- **Database/Auth/Storage:** Supabase with RLS on every table
- **Email:** Resend with React Email templates in `/emails`
- **Geolocation:** Browser `navigator.geolocation`
- **CSV parsing:** PapaParse for bulk member imports
- **Charts:** Recharts for analytics

## Getting started
1. `cd attendance-system`
2. `npm install`
3. Copy `.env.local.example` to `.env.local` and populate all Supabase and Resend values.
4. `npm run dev`
5. Visit [http://localhost:3000](http://localhost:3000) for the landing page, `/login` for the admin login, and `/dashboard` for the admin application.

## Environment variables

Set the following keys in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_SITE_URL
```

`SUPABASE_SERVICE_ROLE_KEY` should never be exposed to clients; the rest can be used wherever needed.

## Supabase setup
1. Create a Supabase project.
2. Run `supabase_schema.sql` to provision the full church-management foundation schema and RLS policies.
3. Run `supabase_storage.sql` to recreate the required buckets and storage policies.
4. Create at least one email/password user in Supabase Authentication so you can sign in through `/login`.
5. Keep Row Level Security enabled; authenticated users have full admin-app access, while anonymous access is limited to public attendance.

## Resend setup
1. Create a Resend account.
2. Generate an API key and paste it into `RESEND_API_KEY`.
3. Add a verified sender address to `RESEND_FROM_EMAIL`.
4. Style the templates inside `/emails` to match the blue/white system.

## Directory overview

```
app/                 ← App Router pages, layouts, dashboard routes, and public attendance pages
components/          ← UI atoms, dashboards, members, visitors, attendance, reports
lib/                 ← Supabase client, query setup, CSV helpers, upload helpers, service wrappers
hooks/               ← Shared custom hooks
types/               ← Shared TypeScript definitions
constants/           ← Navigation and domain constants
emails/              ← React Email templates used by Resend
proxy.ts            ← Protects admin routes while allowing public attendance pages
supabase_schema.sql  ← Database schema and RLS policies
supabase_storage.sql ← Storage buckets and policies
docs/                ← Product and implementation planning documents
```

## Features at a glance
- Member management: add/edit/deactivate members, search/filter by department or status, bulk import CSV, view attendance history.
- Visitor workflows: log visits, track follow-up status, convert visitors into full members.
- Attendance: create services, share public check-in links that embed `serviceId`, capture optional GPS data, and support geofenced public check-in without QR scanning.
- Reports & analytics: member growth line chart, attendance by service type bar chart, visitor follow-up report, absent members list, and CSV export hooks.
- Email automations: welcome new members, send reminders, follow up with pending visitors, and persist every email in `email_logs`.

## Deployment
1. Push to GitHub.
2. Create a Vercel project and import the repository.
3. Configure the same environment variables as in `.env.local`.
4. Deploy and verify that `/login` routes authenticated users into `/dashboard` and `/attendance/[serviceId]` stays public.

## Next steps
- Run `npm run build` to validate the project before deploying.
- Keep `supabase/migrations/20260427090000_initial_church_management_schema.sql` and `20260427091000_initial_storage_setup.sql` as the clean starting point for new environments.
- Consider connecting additional analytics or logging tools before going to production.
