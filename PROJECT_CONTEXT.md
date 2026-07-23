# AWO Course — Full Project Context

## Who This Is For

Jun is a commissioned Singapore Air Force officer about to start a 6-month Air Warfare Officer (AWO) course at Paya Lebar Air Force Base (Air Force Training Command). Jun is likely the Course IC (In Charge) — responsible for the wellbeing and accountability of all course mates. The course will have ~10–15 people, mostly cadets. AWO specialisation is TBD (ATC / ABM / ADW).

---

## Why This Site Was Built

To save time and reduce friction for the course. Key pain points it solves:
- Commanders asking "where is everyone?" → Parade State page
- Course mates needing each other's contacts → Directory page
- Sharing notes and lessons from training → Lessons Learned + Resources pages
- Knowing who is responsible for what → Roles & Responsibilities page

---

## What Was Built

A full-stack web portal with 8 pages:

| Page | Purpose |
|---|---|
| `/login` | Username + password sign-in (no email field visible to users) |
| `/dashboard` | Today's strength summary (IC/OOC/Medical/Not Updated) + quick links |
| `/parade-state` | Mon–Sun weekly grid for all members; each person updates their own row |
| `/directory` | Contact cards (phone, Telegram, WhatsApp, email); users edit their own |
| `/roles` | Course appointments with descriptions and holders (admin manages) |
| `/lessons` | Anyone can post lessons learned / good gems; expandable card list |
| `/resources` | File library (PDFs, PPTs) organised by category; anyone can upload |
| `/admin` | Create accounts, toggle admin rights, reset passwords |

---

## Key Design Decisions

### Authentication
- Login is **username + password only** — no email field shown to users
- Internally, the app converts `username` → `username@awo-course.app` for Supabase auth
- Example: type `JLIM` as username, enter password → signed in
- You (Course IC) + one other person are admins; everyone else is a standard member

### Parade State
- Full Mon–Sun grid (not just weekdays — includes Sat/Sun for book-in/book-out)
- Everyone updates their row by **Sunday** for the upcoming week
- Ad-hoc updates allowed any day
- Statuses: **In Camp (IC)**, **Out of Camp (OOC)**, **RSO**, **RSI**, **Medical Appt (MA)**
- Each day has a free-text notes field (e.g. "Medical appt at NUH, back by 1400")
- Users can only edit their own row; admins can edit anyone's
- Week navigation via URL: `/parade-state?week=2025-07-21`

### Directory
- Shows all course members as cards
- Contact info: phone, Telegram, WhatsApp, personal email
- Each person edits their own contact details after logging in

### Roles & Responsibilities
- Common appointments: Course IC, Admin IC, Sports IC, Book In/Book Out IC
- Admin can add, edit, delete roles and assign holders
- Anyone can view

### Lessons Learned
- Anyone can post; anyone can delete their own
- Admins can delete any entry
- Expandable card format with author name and date

### Resources (Files)
- Upload PDFs, PPTs, DOCX to Supabase Storage
- Organised into categories (e.g. "ATC Notes", "ADW Notes", "Doctrine", etc.)
- Download via signed URLs (secure, 1-hour expiry)
- Admin or uploader can delete files

### Design
- Clean, minimal, professional
- **Both light and dark mode** (toggle in sidebar/header)
- Mobile-first — works well on phone (horizontal scroll on parade state grid)
- No course name/logo yet — placeholder is "AWO Course" until course number is assigned

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.11 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (uses @base-ui/react, NOT Radix) |
| Backend | Supabase (auth, PostgreSQL database, file storage) |
| Deployment | Vercel (free tier) |
| Theme | next-themes (light/dark toggle) |
| Icons | lucide-react |
| Notifications | sonner (toast messages) |

### Important: shadcn in this project uses @base-ui/react
This is different from the standard shadcn setup. Key API differences:
- `Button` has **no `asChild` prop** — use a plain `<a>` tag for link buttons
- `Select.onValueChange` receives `(value: string | null, ...)` — handle the null case
- `TooltipProvider` uses `delay` (not `delayDuration`)
- `TooltipTrigger` has **no `asChild`** — attach handlers directly to the trigger element

### Next.js 16 Breaking Changes (already handled in code)
- `middleware.ts` → renamed to `proxy.ts`; export function must be named `proxy`
- `cookies()`, `headers()`, `params`, `searchParams` are all fully **async** — must `await` them

---

## Project File Structure

```
awo-course/
├── src/
│   ├── proxy.ts                    ← Auth protection (Next.js 16 middleware)
│   ├── app/
│   │   ├── layout.tsx              ← Root layout (ThemeProvider, Toaster)
│   │   ├── page.tsx                ← Redirects to /dashboard or /login
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       ├── page.tsx        ← Login UI
│   │   │       ├── login-form.tsx  ← Client form with useActionState
│   │   │       └── actions.ts      ← login() and logout() server actions
│   │   └── (protected)/
│   │       ├── layout.tsx          ← Fetches profile, renders Sidebar + MobileHeader
│   │       ├── dashboard/page.tsx
│   │       ├── parade-state/
│   │       │   ├── page.tsx        ← Reads ?week= param, fetches data
│   │       │   └── actions.ts      ← upsertParadeState()
│   │       ├── directory/
│   │       │   ├── page.tsx
│   │       │   ├── directory-client.tsx
│   │       │   └── actions.ts      ← updateProfile()
│   │       ├── roles/
│   │       │   ├── page.tsx
│   │       │   ├── roles-client.tsx
│   │       │   └── actions.ts      ← upsertRole(), deleteRole()
│   │       ├── lessons/
│   │       │   ├── page.tsx
│   │       │   ├── lessons-client.tsx
│   │       │   └── actions.ts      ← addLesson(), deleteLesson()
│   │       ├── resources/
│   │       │   ├── page.tsx        ← Generates signed URLs server-side
│   │       │   ├── resources-client.tsx
│   │       │   └── actions.ts      ← saveResourceMeta(), deleteResource()
│   │       └── admin/
│   │           ├── page.tsx
│   │           ├── admin-client.tsx
│   │           └── actions.ts      ← createUser(), updateUserAdmin(), resetPassword()
│   ├── components/
│   │   ├── sidebar.tsx             ← Desktop sidebar with nav + user info
│   │   ├── mobile-header.tsx       ← Mobile top bar + Sheet drawer
│   │   ├── theme-toggle.tsx
│   │   ├── providers/theme-provider.tsx
│   │   ├── parade-state/
│   │   │   ├── parade-grid.tsx     ← Interactive Mon–Sun grid
│   │   │   └── edit-dialog.tsx     ← Status + notes edit dialog
│   │   ├── directory/
│   │   │   └── edit-profile-dialog.tsx
│   │   └── resources/
│   │       └── upload-dialog.tsx   ← File picker + upload to Supabase Storage
│   └── lib/
│       ├── types.ts                ← Shared TypeScript types + status colors/labels
│       ├── date-utils.ts           ← Week calculation helpers (getMonday, toDayIndex, etc.)
│       └── supabase/
│           ├── client.ts           ← Browser Supabase client
│           ├── server.ts           ← Server Supabase client (async cookies)
│           └── admin.ts            ← Service role client (for admin user creation)
├── supabase/
│   └── schema.sql                  ← Full DB schema: run this in Supabase SQL Editor
├── .env.local                      ← Supabase credentials (fill these in)
├── SETUP.md                        ← Step-by-step setup guide
└── PROJECT_CONTEXT.md              ← This file
```

---

## Database Schema (Supabase)

### Tables
- **profiles** — id, username, ops_name, full_name, appointment, contact_number, telegram, whatsapp, email, is_admin
- **parade_state** — user_id, week_start (always a Monday), day_of_week (0=Mon…6=Sun), status, notes
- **course_roles** — title, description, holder_id, sort_order
- **lessons** — author_id, title, content
- **resources** — uploader_id, title, description, category, file_url, file_name, file_size

### Security
- Row-Level Security (RLS) enabled on all tables
- Users can only edit their own data; admins can edit everything
- Storage bucket `resources` is private; files served via signed URLs

### Auto-profile trigger
When a new auth user is created, a trigger automatically creates their profile row using metadata passed during account creation.

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Found in: Supabase Dashboard → Project Settings → API

---

## Next Steps (To Get Live)

1. **Create Supabase project** at supabase.com (free)
2. **Run `supabase/schema.sql`** in the Supabase SQL Editor
3. **Create your admin account** directly in Supabase Auth dashboard, then set `is_admin = true` via SQL
4. **Fill in `.env.local`** with your Supabase URL and keys
5. **Run locally**: `npm run dev` → test at http://localhost:3000
6. **Deploy to Vercel**: push to GitHub, import into Vercel, add env vars

---

## Things to Do Later

- [ ] Add course name/number/motto once assigned (replace "AWO Course" throughout)
- [ ] Set up Telegram group + link it in the site footer or dashboard
- [ ] Consider adding a shared announcements/noticeboard section
- [ ] Add a simple calendar/timetable section once training schedule is known
- [ ] Update course member appointment dropdown options as needed
