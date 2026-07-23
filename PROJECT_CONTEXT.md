# AWO Course — Full Project Context

## Who This Is For

Jun is a commissioned Singapore Air Force officer running a 6-month Air Warfare Officer (AWO) course at Paya Lebar Air Force Base (Air Force Training Command) as Course IC. The course has ~15 members.

---

## What Was Built

A full-stack web portal with 8 pages:

| Page | Purpose |
|---|---|
| `/login` | Username + password sign-in (no email shown to users) |
| `/dashboard` | Widget-based home: parade state hero + 4 section widgets |
| `/parade-state` | Today's status breakdown by name + weekly Mon–Sun grid |
| `/directory` | Contact cards (phone, Telegram, WhatsApp, email) |
| `/roles` | Course appointments and holders (admin manages) |
| `/lessons` | Shared lessons learned / gems |
| `/resources` | File library (PDFs, PPTs) with signed download URLs |
| `/admin` | Create accounts, toggle admin rights, reset passwords |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.11 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (uses **@base-ui/react**, NOT Radix) |
| Backend | Supabase (auth, PostgreSQL, storage) |
| Deployment | Vercel (auto-deploys from GitHub) |
| Theme | next-themes (light/dark toggle) |
| Icons | lucide-react |
| Notifications | sonner |

### shadcn/base-ui API differences (critical — different from standard shadcn)
- `Button` has **no `asChild`** — use raw `<a>` for link buttons
- `Select.onValueChange` receives `(value: string | null, ...)` — handle null
- `TooltipProvider` uses `delay` (not `delayDuration`)
- `TooltipTrigger` has **no `asChild`** — attach handlers directly
- `SheetTrigger` has no `asChild` — use controlled `open`/`onOpenChange`

### Next.js 16 breaking changes (already handled)
- `middleware.ts` → renamed to `proxy.ts`; export must be named `proxy`
- `cookies()`, `headers()`, `params`, `searchParams` are all fully **async**

---

## GitHub & Deployment

- **Repo:** https://github.com/junlimcodes/AWO-Course-Dashboard
- **Vercel:** auto-deploys on push to `main`
- **Supabase project:** `https://rdecfpjockhtboqernbc.supabase.co`
- **First admin account:** `jlim@awo-course.app` (login username: `jlim`)

---

## Design Decisions

### Authentication
- Login: username + password only. No email field shown.
- Internally converts `username` → `username@awo-course.app` for Supabase.

### Layout — No Sidebar
- Uses a sticky **top nav bar** (`src/components/top-nav.tsx`) instead of a sidebar.
- Desktop: all nav links visible horizontally.
- Mobile: hamburger button opens a sheet drawer.

### Background & Theme
- Background: flat sky-blue (`oklch(0.87 0.05 218)`) — no grid pattern.
- Cards: pure white so they pop against the blue background.
- Dark mode: deep slate-blue background.
- Border radius: 0.75rem (rounded/playful feel).

### Dashboard
- Widget-based layout — no separate "quick links" section.
- **Parade State hero widget:** shows `X / Y in camp today` as headline, green progress bar, colour chip breakdown.
- **4 secondary widgets:** Directory (member count + avatars), Roles (holder list), Lessons (latest gem), Resources (file count).

### Parade State
- **Today section** (top of page): groups all members by status with names + notes for the current day. Only shown when viewing the current week.
- **Weekly grid** (below): Mon–Sun interactive grid for planning.

### Parade Statuses
- In Camp (IC), Out of Camp (OOC), RSO, RSI, Medical Appt (MA)
- Each day can have free-text notes.

---

## File Structure

```
awo-course/
├── src/
│   ├── proxy.ts                          ← Auth protection (Next.js 16 middleware)
│   ├── app/
│   │   ├── globals.css                   ← Theme colours + flat blue background
│   │   ├── layout.tsx                    ← Root layout (ThemeProvider, Toaster)
│   │   ├── page.tsx                      ← Redirects to /dashboard or /login
│   │   ├── (auth)/login/
│   │   │   ├── page.tsx
│   │   │   ├── login-form.tsx
│   │   │   └── actions.ts                ← login() and logout()
│   │   └── (protected)/
│   │       ├── layout.tsx                ← TopNav + <main> full width
│   │       ├── loading.tsx               ← Spinner shown instantly on navigation
│   │       ├── dashboard/page.tsx        ← Widget dashboard
│   │       ├── parade-state/
│   │       │   ├── page.tsx              ← Today breakdown + weekly grid
│   │       │   └── actions.ts
│   │       ├── directory/
│   │       ├── roles/
│   │       ├── lessons/
│   │       ├── resources/
│   │       └── admin/
│   ├── components/
│   │   ├── top-nav.tsx                   ← Sticky top nav (desktop links + mobile sheet)
│   │   ├── sidebar.tsx                   ← (unused — replaced by top-nav)
│   │   ├── mobile-header.tsx             ← (unused — replaced by top-nav)
│   │   ├── theme-toggle.tsx
│   │   ├── providers/theme-provider.tsx
│   │   ├── parade-state/
│   │   │   ├── parade-grid.tsx           ← Interactive Mon–Sun grid
│   │   │   └── edit-dialog.tsx
│   │   ├── directory/edit-profile-dialog.tsx
│   │   └── resources/upload-dialog.tsx
│   └── lib/
│       ├── types.ts
│       ├── date-utils.ts                 ← Week helpers (SGT-safe)
│       └── supabase/
│           ├── client.ts
│           ├── server.ts
│           └── admin.ts
├── supabase/schema.sql                   ← Full DB schema — run once in Supabase SQL Editor
├── .env.local                            ← Supabase credentials (filled in)
├── SETUP.md
└── PROJECT_CONTEXT.md                    ← This file
```

---

## Database Schema

- **profiles** — id, username, ops_name, full_name, appointment, contact_number, telegram, whatsapp, email, is_admin
- **parade_state** — user_id, week_start (Monday), day_of_week (0=Mon…6=Sun), status, notes
- **course_roles** — title, description, holder_id, sort_order
- **lessons** — author_id, title, content
- **resources** — uploader_id, title, description, category, file_url, file_name, file_size

RLS enabled on all tables. Storage bucket `resources` is private; files served via 1-hour signed URLs.

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://rdecfpjockhtboqernbc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Things To Do Later

- [ ] Add course number/name once assigned (replace "AWO Course" throughout)
- [ ] Add announcements / noticeboard section
- [ ] Add training timetable / calendar once schedule is known
- [ ] Update appointment dropdown options as needed
- [ ] Consider adding a weekly reminder for course mates to update parade state by Sunday
