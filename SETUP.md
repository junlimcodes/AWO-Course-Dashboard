# AWO Course — Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (give it any name, e.g. "awo-course")
3. Wait for the project to spin up (~2 minutes)

---

## 2. Run the Database Schema

1. In your Supabase dashboard → **SQL Editor**
2. Open the file `supabase/schema.sql` in this project
3. Paste the entire contents into the SQL editor and click **Run**

This creates all the tables, RLS policies, storage bucket, and the auto-profile trigger.

---

## 3. Create Your Admin Account

Since the Admin page requires you to already be logged in as admin, your first account must be created directly in Supabase.

1. In your Supabase dashboard → **Authentication → Users → Add user**
2. Set email to: `yourchosenusername@awo-course.app` (e.g. `courseic@awo-course.app`)
3. Set a password
4. Click **Create user**
5. In **SQL Editor**, run:
   ```sql
   UPDATE profiles
   SET is_admin = true, full_name = 'Your Full Name', ops_name = 'IC', appointment = 'Course IC'
   WHERE username = 'yourchosenusername';
   ```

---

## 4. Fill in Environment Variables

Open `.env.local` and replace the placeholders:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Find these in your Supabase dashboard → **Project Settings → API**.
- **URL** → Project URL
- **Anon Key** → `anon` `public` key
- **Service Role Key** → `service_role` key (keep this secret — never commit it)

---

## 5. Run Locally

```bash
cd "awo-course"
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with the username and password you created in step 3.

---

## 6. Add Course Members

Once logged in as admin, go to **Admin → Add Member** to create accounts for each course mate. Give them their username and a temporary password — they can update their profile info (contact number, Telegram, etc.) after logging in.

---

## 7. Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. In **Environment Variables**, add the same 3 variables from `.env.local`
4. Click **Deploy**

Your site will be live at `your-project-name.vercel.app`.

---

## Updating the Course Name

When your course number and title are assigned, search for `AWO Course` across the project and replace with your actual course name.
