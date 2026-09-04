# 🎓 CampusOS — Hackathon Battle Plan (AUST CSE Carnival 8.0)

> ⏱️ **Time: ~5h (3:30 → 8:30 PM).** Repo must be **public by 8:30 PM**. No commits after deadline.
> 🧠 **Prompts:** Antigravity 3.8 Flash (High). Prompts marked 🧠 → use a frontier model (agent logic, vision parsing, debugging).
> 🎯 **Scoring (100):** Data Mgmt 20 · CRUD 20 · **AI Agent 40** · UI/UX 20. Bonus: live deploy + clean code.

---

## 🚨 PRIORITY & TIME REALITY — READ FIRST

You added 3 big features (RBAC, Smart Image Entry, Audit Trail). They're **great differentiators** but earn **0 direct rubric marks**. So build in this order and use the **go/no-go gates** — never sacrifice the 100 marks for a differentiator.

| Tier | Prompts | Why | If behind schedule |
|---|---|---|---|
| **TIER 1 — Locks 100 marks** | P0, P1, P3, P4, P5, P8, P9, P10 | The actual rubric | Never cut |
| **TIER 2 — Differentiators** | P2 (RBAC), P7 (Smart Entry 🌟), P6 (Audit) | Judge wow-factor + strengthens agent "refuse unauthorized" | Cut in this order if late: **P6 → P2 (fall back to demo-mode roles) → P7** |

> 🌟 **Smart Entry (P7) is your standout** — it uses Gemini **vision**, which you're already paying for. If you must choose one differentiator, keep this.
> 🔗 **RBAC bonus:** Students being blocked from editing data makes the agent correctly **refuse unauthorized edits** → directly helps the Agent's 10-mark "refuse when it shouldn't act" criterion.
> 🛟 **Demo-mode fallback:** If RBAC verification runs long, ship a `NEXT_PUBLIC_DEMO_MODE=true` that auto-logs-in as a Super Admin, so every feature is demoable even without the full signup→approve flow.

---

## ⚡ QUICKSTART (first 10 minutes)

1. **Fork** `https://github.com/sakibul-shovon/cse-carnival-8-aibuild-hackathon`. Make it **private** now, flip **public before 8:30**.
2. `git clone https://github.com/YOUR_USERNAME/cse-carnival-8-aibuild-hackathon.git && cd ...`
3. Create a **Supabase** project → grab `Project URL`, `anon key`, `service_role key`. Create a Storage bucket `notices` (public).
4. Get a **Gemini API key** → https://aistudio.google.com/apikey (model `gemini-2.5-flash` = text + vision + function calling).
5. Generate the **Figma design** now (§4) in parallel — don't wait on it.
6. Fire prompts **top to bottom**. Commit after every green checklist.

---

## 1. 📋 Project Context

**CampusOS** — an intelligent university platform: a **role-based data dashboard** for 5 campus systems + an **AI agent** that reads/acts on live campus data via real function calling, with an **AI image-to-data pipeline** and a **public audit trail**.

**The core magic (demo this):** Edit an announcement (or approve an image-parsed change) → ask the agent → it already knows. (Live data → agent.)

### The parts
- **Part 1 — Campus Data Manager:** View + full CRUD for 5 systems, changes persist & reflect instantly (no refresh). Plus **book/cancel** rooms, **register/cancel** events. Now **role-gated**.
- **Part 2 — AI Agent:** Chat that looks up, reasons across sources, takes actions, asks when vague, refuses when unauthorized. Always reads live data. **Role-aware** (students can't edit data).
- **Part 3 — RBAC:** Super Admin verifies/activates accounts; CR/SR manage data; students view + use agent.
- **Part 4 — Smart Data Entry 🌟:** Upload a photo of a routine/notice → Gemini vision drafts CRUD ops → human reviews **Accept/Reject** before it hits the DB.
- **Part 5 — Audit Trail:** Every change logs to a **public History page** ("CR Sec-A CSE Sem-3 Yr-2 updated Schedule for CSE321 at 10:05 AM").

### User roles (RBAC)
| Role | Verified by | Can do |
|---|---|---|
| **Super Admin** | (seeded / first user) | Everything + **verify/activate/reject** accounts, assign roles |
| **CR / SR** (Data Managers) | Super Admin | Full CRUD on all 5 systems, use Smart Entry, book/register, use agent |
| **Student** (General) | Super Admin | View dashboard, use agent, **book room / register event** only. **Cannot** add/edit/delete campus data |
| **Pending** (new signup) | — | Sees "awaiting approval" screen only |

### The 5 systems (seed: `data/*.json`)
| System | Records | CRUD | Extra actions |
|---|---|---|---|
| Schedules | 24 | ✅ | — |
| Rooms | 20 | ✅ | **book, cancel** |
| Events | 7 | ✅ | **register, cancel** |
| Announcements | 8 | ✅ | — |
| Assignments | 8 | ✅ | — |

### MVP (must demo — mapped to marks)
- [ ] All 5 systems loaded from backend + displayed clearly (20)
- [ ] Add/Edit/Delete works & persists for all 5 (20)
- [ ] Agent answers, acts, uses live data, refuses vague/unauthorized (40)
- [ ] Clean, polished, usable UI (20)
- [ ] 🌟 Differentiators: RBAC + Smart Image Entry + Audit History (bonus/wow)

### ❌ Out of scope
- Payments · email verification · password reset · mobile app · fine-grained per-section permissions beyond role tiers.

---

## 2. 🛠️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router, TS) | UI + API + server actions in one repo |
| Styling | **Tailwind CSS v4** | fast, tokenized |
| UI kit | **shadcn/ui** (new-york) + lucide-react | polished, accessible |
| Backend | Next.js **Server Actions** + Route Handlers | no separate server |
| Database | **Supabase Postgres** (`jsonb` for nested) | instant DB + realtime |
| **Auth** | **Supabase Auth** (`@supabase/ssr`) | email/password login, RBAC sessions |
| **Storage** | **Supabase Storage** (`notices` bucket) | uploaded routine/notice images |
| Realtime | **Supabase Realtime** | dashboard + history no-refresh updates |
| **LLM** | **Gemini** via `@google/genai`, `gemini-2.5-flash` | **function calling** (agent) + **vision** (image parsing) |
| Forms | react-hook-form + zod | typed CRUD + auth forms |
| Deploy | **Vercel** + Supabase cloud | git-push, bonus |
| Charts (opt.) | recharts | dashboard summary |

### `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-only (admin ops, seed). Do NOT expose client-side.
GEMINI_API_KEY=                  # server-only (agent + vision)
DEMO_DATE=                       # pin "today" to match seed dates (YYYY-MM-DD)
NEXT_PUBLIC_DEMO_MODE=false      # true → auto-login as super admin (fallback for demo)
SUPER_ADMIN_EMAIL=               # this account is auto-promoted to super_admin on seed
```
> ⚠️ Public repo: commit `.env.example` only. Keep service-role + Gemini keys out of git; add them in Vercel env + judges add locally (document in README). RLS stays enabled (see below).

---

## 3. 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                  │
│  Role-aware Dashboard (5 CRUD sections)  │  AI Agent chat            │
│  Super Admin panel · Smart Entry (image) │  Public History feed      │
│  Next.js RSC+Client · Tailwind + shadcn · Supabase Realtime          │
└───────────────┬─────────────────────────────────────┬───────────────┘
                │ Server Actions (auth+role checked)   │ POST /api/agent
                │ /api/parse-image (vision)            │
                ▼                                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS SERVER (Vercel)                        │
│  @supabase/ssr session → reads caller's profile.role for EVERY       │
│  mutation (CR/SR/Admin only; students blocked → agent refuses)       │
│  lib/actions/*  CRUD + book/register + audit log write               │
│  /api/parse-image  Gemini VISION → draft ops → pending_changes       │
│  /api/agent  Gemini FUNCTION CALLING, live-data tools, role-aware    │
└───────────────┬─────────────────────────────────────┬───────────────┘
                │ supabase-js (RLS)                     │ tools read/write
                ▼                                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                          SUPABASE                                     │
│  Auth · Storage(notices) · Postgres · Realtime                       │
│  schedules · rooms(jsonb) · events(jsonb) · announcements · assign.  │
│  profiles(role,status) · pending_changes(jsonb) · audit_log          │
└────────────────────────────────────────────────────────────────────┘
       seed: scripts/seed.ts → data/*.json + promote SUPER_ADMIN_EMAIL
```

### Tables
- **5 systems** (unchanged): `schedules`, `rooms(equipment text[], bookings jsonb)`, `events(registrations jsonb, registered, capacity, status)`, `announcements`, `assignments`.
- `profiles(id uuid pk = auth.users.id, email, full_name, role text, status text, section, semester, year, created_at)` — `role ∈ {super_admin,cr,sr,student}`, `status ∈ {pending,active,rejected}`.
- `pending_changes(id, entity_type, operation, target_id, payload jsonb, source text, image_url, status text, proposed_by, proposer_label, created_at, reviewed_by, reviewed_at)` — `source ∈ {ai_image,manual}`, `status ∈ {pending,accepted,rejected}`.
- `audit_log(id, actor_id, actor_label, actor_role, action, entity_type, entity_id, summary, details jsonb, created_at)`.

### RLS strategy (fast but real)
- Enable RLS on all tables. **Read**: allow any authenticated user to `select` the 5 systems + `audit_log` (+ own `profiles`).
- **Write**: enforce role in **server actions** (server reads caller's `profiles.role`; only `cr/sr/super_admin` may mutate the 5 systems + accept/reject pending; only `super_admin` may change `profiles`). Keep RLS write policies permissive-to-authenticated as a backstop; the authoritative check is server-side. (Demo-safe, avoids fighting complex SQL policies under time pressure.)

### Agent tools (function calling)
**Read:** `get_schedules(day?,course?)` · `get_assignments(status?,due_before?)` · `get_announcements(priority?)` · `get_events(status?)` · `get_rooms(min_capacity?,equipment?,type?)` · `get_next_class()` · `check_room_availability(...)` · `find_available_rooms(...)` · `get_current_datetime()`
**Act (permission-checked):** `book_room(...)` · `cancel_room_booking(...)` · `register_for_event(...)` · `cancel_event_registration(...)` — allowed for all authenticated users. Any request to add/edit/delete campus **data** → agent **refuses** for students, or defers to dashboard (no data-mutation tools exposed to the agent).

### Folder structure
```
app/
  (auth)/login · (auth)/signup · pending/page.tsx
  (app)/page.tsx                 # dashboard (5 sections, role-aware)
  (app)/admin/page.tsx           # super admin: verify/activate users
  (app)/smart-entry/page.tsx     # image upload + pending review queue
  (app)/history/page.tsx         # public audit feed
  (app)/agent/page.tsx           # or slide-over chat
  api/agent/route.ts · api/parse-image/route.ts
  layout.tsx · globals.css · middleware.ts
components/{ui, systems, agent, admin, smart-entry, history}
lib/
  supabase/{client,server,middleware}.ts
  auth/{roles.ts,getCurrentProfile.ts}
  actions/{schedules,rooms,events,announcements,assignments,pending,admin}.ts
  agent/{tools,systemPrompt}.ts
  audit.ts · now.ts · validations/*
scripts/seed.ts · data/*.json
```

---

## 4. 🎨 Figma Design Prompt

> Paste into Figma AI / Figma Make. Reference the tokens (below) in every build prompt. Figma is a **visual guide** — the actual "wiring" is locking the tokens into `globals.css` in Prompt 0; you don't import Figma code.

```
Design a modern, production-grade university platform web app called "CampusOS".

PRODUCT: A role-based campus dashboard + AI agent that keeps class schedules, rooms, events,
announcements, and assignment deadlines in one place. Class Representatives (CRs) and admins
manage data (manually or by uploading a photo of a routine that AI parses); students view it and
ask an AI agent to look things up and take actions (book a room, register for an event). Every
change is publicly logged. Users: students, CRs/SRs, and a super admin.

SCREENS (desktop 1440px + mobile 390px):
1. Login / Signup — clean centered card; signup collects name, role request (CR/SR/Student),
   section/semester/year.
2. "Awaiting approval" screen — friendly pending state for unverified users.
3. Super Admin panel — table of users with role + status, Approve / Reject / role-assign controls.
4. Dashboard home — role-aware. 5 clear sections (Schedule weekly grid, Rooms cards, Events cards,
   Announcements feed, Assignments list). Summary cards up top. CR/Admin see Add/Edit/Delete;
   students see read-only + "Ask AI" / book / register.
5. Smart Data Entry — upload a routine/notice image; show the AI-extracted proposed changes as
   review cards with clear Accept / Reject; a "Pending changes" queue.
6. History / Audit feed — reverse-chronological timeline of who changed what and when, with
   role badges and entity tags.
7. AI Agent chat — slide-over/page; message bubbles, a "tool used" badge (e.g. "🔧 book_room"),
   typing state, suggested-prompt chips.
8. Empty / loading (skeleton) / error states for every section.

VISUAL LANGUAGE (STRICT — avoid generic AI aesthetics):
- Style: sleek, trustworthy, academic-modern SaaS. Confident but calm.
- Color: ONE primary deep teal #0F766E + warm accent amber #F59E0B + zinc neutral scale.
  NOT purple-on-white. Priority: high=red, medium=amber, low=zinc. Role badges:
  super_admin=teal, cr/sr=indigo, student=zinc.
- Typography: "Space Grotesk" headings (tight tracking), "Inter" body. Strong scale, generous leading.
- Layout: 8px grid, generous whitespace, max ~1200px, scannable hierarchy.
- Components: radius 10px, subtle 1px borders over heavy shadows, one soft shadow token,
  pill badges (equipment/priority/role/status), progress bars for event capacity, timeline for history.
- Motion: 150–200ms hover lifts, skeleton loaders.
- Dark mode: true-neutral zinc darks (not blue-tinted).

MUST FEEL: intentional, premium, uncluttered, genuinely usable.
AVOID (AI slop): purple gradients, glassmorphism overload, centered-everything, emoji-as-icons,
lorem cards, inconsistent spacing, 5 competing font sizes, hero blobs.

Deliver: component library (button, input, select, card, dialog, table, badge/pill, tabs, toast,
progress, timeline item, chat bubble, file-upload dropzone) + all screens above, light + dark.
```

### 🎯 Design tokens (lock these)
```
Primary:  #0F766E (teal)     Accent: #F59E0B (amber)
BG:       #FFFFFF / #09090B    Muted:  #F4F4F5 / #18181B
Border:   #E4E4E7 / #27272A    Text:   #09090B / #FAFAFA
Priority: high #DC2626 · medium #F59E0B · low #71717A
Roles:    super_admin #0F766E · cr/sr #4F46E5 · student #71717A
Status:   pending #F59E0B · active #16A34A · rejected #DC2626
Radius: 10px   Shadow: 0 1px 3px rgba(0,0,0,.08)
Font heading: Space Grotesk   Font body: Inter
```

---

## 5. 🧩 Build Prompts (run in order)

> Copy each **Prompt** into Antigravity. All reference §4 tokens. 🧠 = frontier model. 🌟 = standout. Tier shown per prompt.

---

### PROMPT 0 — Scaffold + Design Tokens  · TIER 1
- **Branch:** `feat/scaffold`
- **Description:** Bootstrap Next.js + Tailwind + shadcn + Supabase (auth-ready) + Gemini SDK + tokens.
- **Prompt:**
```
In the forked repo, create a Next.js 15 app (App Router, TypeScript, Tailwind v4, ESLint, app/ dir) at the repo root, keeping the existing data/, schema/, sample_queries/ folders.
Init shadcn/ui (style new-york, base color zinc). Add: button, input, textarea, label, select, card, dialog, form, table, badge, tabs, sonner, skeleton, dropdown-menu, progress, separator, scroll-area, avatar, alert, tooltip.
Install: @supabase/supabase-js, @supabase/ssr, @google/genai, react-hook-form, zod, @hookform/resolvers, lucide-react, date-fns.
Configure next/font for "Space Grotesk" (headings) + "Inter" (body).
globals.css: set §4 tokens as CSS vars wired into the shadcn theme (primary #0F766E, accent #F59E0B, radius 10px, role/status/priority colors), true-neutral zinc dark mode. Add next-themes + a dark-mode toggle.
Create lib/supabase/client.ts (browser), lib/supabase/server.ts (server, cookies via @supabase/ssr), lib/supabase/middleware.ts + middleware.ts refreshing the auth session on every request.
Create .env.local + .env.example with all vars from the plan (SUPABASE url/anon/service_role, GEMINI_API_KEY, DEMO_DATE, NEXT_PUBLIC_DEMO_MODE, SUPER_ADMIN_EMAIL).
Create lib/now.ts (getToday()=DEMO_DATE||today, getNow()).
Root layout: fonts, <Toaster/>, theme provider. Confirm `npm run dev` builds clean.
```
- **Commit:** `feat: scaffold next.js + tailwind + shadcn + supabase(auth) + gemini + tokens`
- **Checklist:**
  - [ ] `npm run dev` runs, zero errors
  - [ ] Teal primary + dark mode work; Space Grotesk/Inter load
  - [ ] supabase client/server/middleware + `middleware.ts` + `lib/now.ts` created
  - [ ] `.env.example` has all vars

---

### PROMPT 1 — DB Schema (systems + RBAC + pending + audit) + Seed  · TIER 1
- **Branch:** `feat/db-and-seed`
- **Description:** All tables (5 systems + profiles + pending_changes + audit_log), RLS, realtime, storage bucket, seed loader that also promotes the super admin.
- **Prompt:**
```
Create SQL (single copy-paste block for Supabase SQL editor):
5 systems with EXACT fields:
- schedules(id text pk, course, title, day, start_time, end_time, room, instructor, section) all text
- rooms(id text pk, room_number text, type text, capacity int, equipment text[], floor int, status text, bookings jsonb default '[]')
- events(id text pk, name, description text, date, start_time, end_time, end_date, venue, organizer text, capacity int, registered int, registrations jsonb default '[]', status text)
- announcements(id text pk, title, body, date, priority, posted_by, expires) text
- assignments(id text pk, course, course_title, title, description, assigned_date, deadline, submission_platform, status text, marks int)
RBAC + workflow tables:
- profiles(id uuid pk references auth.users on delete cascade, email text, full_name text, role text default 'student', status text default 'pending', section text, semester text, year text, created_at timestamptz default now())
- pending_changes(id uuid pk default gen_random_uuid(), entity_type text, operation text, target_id text, payload jsonb, source text, image_url text, status text default 'pending', proposed_by uuid, proposer_label text, created_at timestamptz default now(), reviewed_by uuid, reviewed_at timestamptz)
- audit_log(id uuid pk default gen_random_uuid(), actor_id uuid, actor_label text, actor_role text, action text, entity_type text, entity_id text, summary text, details jsonb, created_at timestamptz default now())
RLS: enable on all. Policies — authenticated users may SELECT all 5 systems + audit_log + pending_changes + their own profile; INSERT/UPDATE/DELETE allowed to authenticated (server actions enforce role). profiles: users select their own + super_admin selects all (or allow authenticated select for the admin panel). Add a trigger to auto-insert a profiles row on new auth.users signup (status 'pending', role 'student').
Enable Realtime for the 5 systems + pending_changes + audit_log.
Storage: note to create a public bucket "notices".
Then scripts/seed.ts (`npx tsx`, npm script "seed"): read data/*.json and UPSERT all records by id (equipment→text[], bookings/registrations→jsonb). Also, if SUPER_ADMIN_EMAIL exists in auth, upsert its profile to role 'super_admin', status 'active'.
Create lib/types.ts (all entities + Profile, PendingChange, AuditLog + Booking, Registration) and zod schemas in lib/validations/.
IMPORTANT: inspect data/*.json date values and report the min/max dates so I can set DEMO_DATE.
```
- **Commit:** `feat: full schema (systems+rbac+pending+audit), rls, realtime, seed loader`
- **Checklist:**
  - [ ] All tables created; `npm run seed` loads 24/20/7/8/8
  - [ ] profiles auto-created on signup (trigger works)
  - [ ] Realtime on systems + pending_changes + audit_log; `notices` bucket created
  - [ ] Types + zod match schema; noted seed date range → set `DEMO_DATE`

---

### PROMPT 2 — Auth + RBAC + Super Admin Panel  · TIER 2 (foundational)
- **Branch:** `feat/auth-rbac`
- **Description:** Signup/login, role/status gating, pending screen, super-admin verify/activate/reject + role assignment. Includes demo-mode bypass.
- **Prompt:**
```
Implement Supabase email/password auth with @supabase/ssr + RBAC, matching §4 tokens.
- /signup: name, email, password, requested role (CR/SR/Student), section/semester/year. Creates auth user (profile auto-created 'pending'/'student'); if they requested cr/sr store that as requested role in the profile too (still pending). Redirect to /pending.
- /login: standard; on success route by status/role: pending→/pending, active→/ (dashboard).
- /pending: friendly "awaiting Super Admin approval" screen with sign-out.
- lib/auth/getCurrentProfile.ts (server): returns the caller's profile (id, role, status, label). lib/auth/roles.ts: helpers isManager(role) = role in {cr,sr,super_admin}, isAdmin(role)=super_admin, and a proposerLabel(profile) → e.g. "CR Sec-A CSE Sem-3 Yr-2" (fallback to name/role).
- Middleware/layout guard: unauthenticated→/login; authenticated but status!=active→/pending; only super_admin may open /admin.
- /admin (super admin panel): table of all profiles (name, email, role, status, section/sem/year) with Approve (status→active), Reject (status→rejected), and a role selector (student/cr/sr/super_admin). Server actions in lib/actions/admin.ts, guarded so only super_admin can call. Toasts + realtime refresh.
- Nav: show a role badge (colors from §4) + the user's label + sign out.
- DEMO MODE: if NEXT_PUBLIC_DEMO_MODE==='true', bypass guards and treat the session as a super_admin (documented, for judging fallback).
Test: signup → pending → admin approves → user gets dashboard.
```
- **Commit:** `feat: supabase auth, rbac guards, and super admin verification panel`
- **Checklist:**
  - [ ] Signup → /pending; login routes by status/role
  - [ ] Super admin can approve/reject + change roles (persists)
  - [ ] Non-admin blocked from /admin; unverified stuck on /pending
  - [ ] Role badge + label in nav; demo-mode bypass works

---

### PROMPT 3 — App Shell + Dashboard Layout (role-aware)  · TIER 1
- **Branch:** `feat/app-shell`
- **Description:** Persistent shell, role-aware nav (Admin/Smart-Entry/History links gated), summary cards, 5-section frame.
- **Prompt:**
```
Build the CampusOS app shell (§4 tokens). Header: logo "CampusOS", role badge + user label, dark-mode toggle, "Ask CampusOS" agent entry, sign out.
Nav links, role-gated: Dashboard (all), Smart Entry (cr/sr/admin), History (all), Admin (super_admin only).
Dashboard at / : tabs/section nav for the 5 systems + top summary cards (placeholders): Next class, Due this week, High-priority notices, Upcoming events.
Reusable UI: SectionHeader, EmptyState, skeleton loader, priority Badge (high/med/low), equipment pill, role Badge, status Badge. A small helper that hides Add/Edit/Delete controls for non-managers (isManager).
Modern UI: 8px grid, whitespace, subtle borders over shadows, 150ms transitions, responsive 390→1440. No AI-slop.
```
- **Commit:** `feat: role-aware app shell, nav, and summary cards`
- **Checklist:**
  - [ ] Header + role-gated nav render (students don't see Admin/Smart Entry)
  - [ ] Summary cards + EmptyState + skeleton + badges exist
  - [ ] Dark mode consistent; responsive; no errors

---

### PROMPT 4 — Part 1: Display All 5 Systems (Data Mgmt = 20)  · TIER 1
- **Branch:** `feat/data-views`
- **Description:** Read from Supabase, render all 5 systems clearly, live via Realtime. Locks Data Mgmt 20.
- **Prompt:**
```
Fetch from Supabase and render all 5 systems (§4 tokens):
- Schedule: weekly table/grid by day (Sun–Thu): course/title/time/room/instructor/section.
- Rooms: card grid — room_number, type, capacity, floor, status badge, equipment pills, bookings count.
- Events: card grid — name, date/time, venue, organizer, capacity progress bar (registered/capacity), status badge.
- Announcements: feed sorted date desc, priority-colored, posted_by + expiry.
- Assignments: list sorted by deadline asc, course+title+deadline+status+marks; highlight due-this-week (lib/now.ts).
Wire the summary cards to real live counts (next class, due-this-week, high-priority, upcoming events).
Add a Supabase Realtime subscription so any insert/update/delete updates the UI live with NO refresh. Empty + skeleton states everywhere.
```
- **Commit:** `feat: live data views for all 5 systems with realtime`
- **Checklist:**
  - [ ] All 5 systems show real data, clearly laid out
  - [ ] Summary cards correct; edit a row in Supabase → UI updates live
  - [ ] Empty + loading states; responsive; no errors

---

### PROMPT 5 — Part 1: Role-Gated CRUD + Book/Register + Audit (CRUD = 20)  · TIER 1
- **Branch:** `feat/crud-actions`
- **Description:** Add/Edit/Delete for 5 systems + room book/cancel + event register/cancel, all role-checked server-side and audit-logged. Locks CRUD 20.
- **Prompt:**
```
Implement full CRUD for all 5 systems via server actions in lib/actions/<system>.ts (supabase server client), validated with zod, revalidatePath after each mutation.
ROLE CHECK: at the start of every mutation, load the caller's profile (lib/auth/getCurrentProfile) and reject if not isManager(role) (cr/sr/super_admin). book/register are allowed for ANY authenticated user.
UI: per system, an "Add" button → shadcn Dialog + react-hook-form; Edit (prefilled) + Delete (confirm). Hide these controls for non-managers. sonner toasts. New ids: `${prefix}-${crypto.randomUUID().slice(0,8)}`.
Extra actions:
- Rooms: Book (append to bookings jsonb: booking_id, booked_by, date, start_time, end_time, purpose; reject overlaps) + Cancel booking (by booking_id).
- Events: Register (append {student_id,name}, increment registered, block if full→status 'full') + Cancel registration.
AUDIT: create lib/audit.ts writeAudit({action, entity_type, entity_id, summary}) that inserts into audit_log using the caller's id/label/role. Call it after EVERY successful mutation (create/update/delete/book/register/cancel) with a human summary, e.g. "updated Schedule CSE321 (room 7A03→7A04)".
All changes persist to Supabase + appear instantly via realtime. Accessible, on-brand.
```
- **Commit:** `feat: role-gated CRUD + booking/registration + audit logging`
- **Checklist:**
  - [ ] Add/Edit/Delete persist for **all 5** (reload → still there)
  - [ ] Non-managers get no edit controls + server rejects their mutations
  - [ ] Room book/cancel (overlaps rejected); event register/cancel (full handled)
  - [ ] Every change writes an audit_log row; changes appear with no refresh

---

### PROMPT 6 — Audit Trail: Public History Page  · TIER 2
- **Branch:** `feat/history`
- **Description:** Real-time public feed of all changes. ("CR Sec-A CSE Sem-3 Yr-2 updated Schedule for CSE321 at 10:05 AM").
- **Prompt:**
```
Build /history (visible to all authenticated users) reading audit_log, newest first, as a clean timeline (§4 tokens).
Each item: actor role badge + actor_label, action verb, entity_type + entity_id, the summary, and a relative + absolute timestamp (date-fns). Example line: "CR Sec-A CSE Sem-3 Yr-2 updated the Schedule for CSE321 — 10:05 AM".
Add filters: by entity_type and by action. Subscribe to audit_log via Realtime so new events stream in live (subtle highlight on new rows). Empty + skeleton states. Add a compact "recent activity" widget (last 5) on the dashboard linking to /history.
```
- **Commit:** `feat: public real-time audit history page`
- **Checklist:**
  - [ ] History shows all logged changes with actor label + role + time
  - [ ] Filters work; new changes stream in live
  - [ ] Dashboard recent-activity widget links to it

---

### PROMPT 7 — 🌟 Smart Data Entry: Image → Gemini Vision → Pending Review  · TIER 2 (standout) 🧠
- **Branch:** `feat/smart-entry`
- **Description:** Upload a routine/notice photo → Gemini vision drafts CRUD ops → human Accept/Reject → applied to DB + audited.
- **Prompt:**
```
Build the Smart Data Entry pipeline (managers only: cr/sr/super_admin), §4 tokens.
1. /smart-entry page: a file-upload dropzone (image). On upload, store the file in Supabase Storage bucket "notices" and get a public URL.
2. /api/parse-image (POST {imageUrl or base64, hint?}): server-only, call Gemini gemini-2.5-flash with the image (multimodal) and a strict prompt+JSON schema to extract PROPOSED changes as an array of {entity_type, operation(add/edit/delete), target_id?, payload, confidence, reason}. Give it our schema field names so payloads match. It must NOT write to the systems tables. Insert each proposed op into pending_changes (source 'ai_image', image_url, proposer_label from profile, status 'pending').
3. Pending review queue (on /smart-entry): list pending_changes (source ai_image OR manual) as review cards showing the entity_type, operation, a readable diff/preview of payload, confidence, and the source image thumbnail. Buttons: Accept and Reject (managers only).
   - Accept → apply the change to the real system table (reuse Prompt 5 CRUD logic), set pending row status 'accepted' + reviewed_by/at, and writeAudit(action:'accepted via smart-entry', summary:...). The change then appears live on the dashboard.
   - Reject → status 'rejected' + audit, no data change.
4. Manual path still available: dashboard CRUD (Prompt 5) is unchanged and does NOT go through pending — it applies directly. (Human-in-the-loop is only for AI-proposed changes.)
Handle low-confidence gracefully, show parse errors, loading states. Keep the key server-side.
```
- **Commit:** `feat: AI image-to-data smart entry with human-in-the-loop review`
- **Checklist:**
  - [ ] Upload a routine/notice image → Gemini extracts proposed ops into pending_changes
  - [ ] Review queue shows proposals + image; Accept applies to DB (live) + audits; Reject discards
  - [ ] Only managers can access + accept/reject; key not exposed
  - [ ] Manual dashboard CRUD still works directly (bypasses pending)

---

### PROMPT 8 — Part 2: AI Agent w/ Gemini Function Calling (Agent = 40)  · TIER 1 🧠
- **Branch:** `feat/ai-agent`
- **Description:** Centerpiece. Role-aware Gemini function-calling agent reading live data + taking allowed actions.
- **Prompt:**
```
Build the CampusOS agent with @google/genai, model gemini-2.5-flash, REAL function calling (declare tools → call → toolCall → execute → send results → loop until final text). No prompt-chaining fakes.
lib/agent/tools.ts — each tool executes against Supabase (server client) so it ALWAYS reads live data:
Read: get_schedules(day?,course?), get_assignments(status?,due_before?), get_announcements(priority?), get_events(status?), get_rooms(min_capacity?,equipment?,type?), get_next_class(), check_room_availability(room_number,date,start_time,end_time), find_available_rooms(date,start_time,end_time,min_capacity?,equipment?), get_current_datetime().
Act (allowed for any authenticated user): book_room(...), cancel_room_booking(...), register_for_event(event_name_or_id), cancel_event_registration(event_id). Reuse Prompt 5 logic (overlap/capacity checks), persist, and writeAudit for actions. Do NOT expose any add/edit/delete tool for schedules/rooms/events/announcements/assignments.
/api/agent/route.ts (POST {messages}): run the loop server-side (GEMINI_API_KEY server-only). Load the caller's profile; pass their label + role + get_current_datetime into the system prompt.
System prompt (lib/agent/systemPrompt.ts): CampusOS assistant for THIS student/user; use tools for every factual answer + action; resolve today/tomorrow/this-week from get_current_datetime; combine tools when needed (free-time+events; capacity+equipment+time room search); ALWAYS confirm before booking/registering by stating what it will do; if vague ("book me any room tomorrow afternoon") ASK for missing time/room/size instead of acting; if the user asks to add/edit/delete campus DATA, REFUSE and explain only CRs/admins can change data via the dashboard (this is the unauthorized-refusal case); be concise + friendly.
Chat UI (slide-over or /agent, §4 tokens): bubbles, input, send, typing indicator, suggested-prompt chips (from sample_queries), and a "tool used" badge under assistant messages naming the function(s) run. Handle loading + errors.
```
- **Commit:** `feat: role-aware gemini function-calling agent with live-data tools + chat UI`
- **Checklist:**
  - [ ] Real Gemini function calling (tool calls visible in logs/UI)
  - [ ] "next class" / "due this week" / "high priority" → correct
  - [ ] "Book Room 7A02 tomorrow 3–5 PM" → checks, books, persists (see dashboard)
  - [ ] "Register me for the Guest Lecture on Deep Learning" → registers
  - [ ] Edit in dashboard → agent reflects it immediately (live data)
  - [ ] Asking agent to edit schedule/etc. → politely refuses (unauthorized)

---

### PROMPT 9 — Agent Hardening + Sample-Query QA  · TIER 1 🧠
- **Branch:** `feat/agent-hardening`
- **Description:** Nail every judging query, especially multi-source + the vague/unauthorized traps (10 marks).
- **Prompt:**
```
Harden the agent against the official sample queries; test + fix each:
Simple: "When is my next class?", "What classes do I have on Wednesday?", "What assignments do I have due this week?", "Show me all high priority announcements."
Multi-source: "I'm free until 2 PM — anything on campus I could drop into?" (schedule+events), "Which labs have a projector and fit at least 30?" (type+equipment+capacity).
Actions: "Book Room 7A02 tomorrow 3–5 PM.", "Register me for the Guest Lecture on Deep Learning.", "I need a room for 5 with a projector, tomorrow 2–4." (find_available_rooms → confirm → book).
Traps: "Just book me any room tomorrow afternoon." → must ASK, not act. "Delete the CSE321 class" (from a student) → REFUSE (only CR/admin via dashboard). Also refuse other unauthorized/destructive asks.
Improve tool schemas/descriptions + system prompt so the model reliably picks tools, confirms before acting, asks when vague, and refuses when unauthorized. Add graceful "couldn't find that" answers. Verify a dashboard edit shows in the very next agent answer.
```
- **Commit:** `feat: harden agent for all sample queries + vague/unauthorized handling`
- **Checklist:**
  - [ ] All simple lookups + both multi-source correct
  - [ ] All 3 action queries work end to end
  - [ ] Vague "any room" → asks first; unauthorized edit → refuses
  - [ ] Live-edit-then-ask verified

---

### PROMPT 10 — Polish, Responsiveness, A11y (UI/UX = 20)  · TIER 1
- **Branch:** `feat/polish`
- **Description:** Final visual QA, states, micro-interactions, mobile, accessibility across all pages incl. admin/smart-entry/history.
- **Prompt:**
```
Global polish (§4 tokens) across dashboard, admin, smart-entry, history, agent, auth:
- Consistent spacing (8px grid), hover/focus-visible rings, 150ms transitions, aria-labels on icon buttons, alt text (incl. uploaded images).
- Verify empty/loading(skeleton)/error states everywhere (incl. review queue + history + chat).
- Mobile QA at 390px: no overflow, tappable targets, nav collapses; chat + smart-entry usable on mobile.
- Styled not-found + error boundary.
- Premium touches: section icons, priority/role/status color coding, event capacity bars, history timeline, chat suggested-prompt chips.
- Dark mode clean everywhere (true-neutral).
No AI-slop. Intentional + uncluttered.
```
- **Commit:** `feat: UI/UX polish, responsive, accessibility across all pages`
- **Checklist:**
  - [ ] Every screen clean at 390px + 1440px; all states present
  - [ ] Hover/focus/transitions consistent; dark mode clean
  - [ ] not-found + error styled; feels polished

---

### PROMPT 11 — Deploy + README + Demo (Bonus)  · TIER 1
- **Branch:** `chore/deploy-docs`
- **Description:** Ship to Vercel, run instructions incl. roles/demo-mode, verify prod, prep demo.
- **Prompt:**
```
Prepare for submission + judging:
- `npm run build` must pass — fix type/lint errors.
- README.md: what CampusOS is (5 systems + agent + RBAC + smart image entry + audit), tech stack, EXACT local run steps (env vars, `npm i`, run the SQL, create `notices` bucket, `npm run seed`, `npm run dev`), how to set DEMO_DATE + SUPER_ADMIN_EMAIL, how to use NEXT_PUBLIC_DEMO_MODE for instant judging, and the live URL. Include test credentials (a seeded super admin + a sample CR + student) OR clear signup→approve steps.
- Complete .env.example; confirm the app runs from a clean clone.
- Vercel deploy steps (import repo, add all env vars) + verify prod: login, role-gated CRUD, smart entry, history, agent answers + books.
- README "Demo script" — the killer flow: (1) upload a routine image → accept a parsed change, (2) edit an announcement, (3) ask the agent → it knows, (4) show it refuse a student edit, (5) show the History feed logged it all.
```
- **Commit:** `chore: production build, README with run steps + roles, and live deploy`
- **Checklist:**
  - [ ] `npm run build` passes; runs from clean clone
  - [ ] Deployed; prod login + CRUD + smart entry + history + agent work
  - [ ] README run steps + demo-mode + test creds documented
  - [ ] **Repo switched to PUBLIC before 8:30 PM**

---

## 6. ✅ FINAL CHECKPOINT — Ship Readiness

### Scored features (100)
- [ ] **Data Mgmt (20):** 5 systems loaded from backend, clear, live
- [ ] **CRUD (20):** add/edit/delete persist for all 5; book/cancel; register/cancel; no-refresh
- [ ] **Agent Q&A (10):** correct across all data
- [ ] **Agent actions (10):** book + register via real function calling, persisted
- [ ] **Agent live data (10):** dashboard/smart-entry change → agent knows immediately
- [ ] **Agent vague/unauthorized (10):** asks when unclear; refuses student data-edits
- [ ] **UI/UX (20):** polished, responsive, dark mode, all states

### Differentiators (wow / bonus)
- [ ] 🔐 RBAC: signup → super admin approves → role-gated access works
- [ ] 🌟 Smart Entry: image → AI proposal → Accept/Reject → applied + audited
- [ ] 📜 Audit: public History feed logs who changed what, live

### Rules compliance
- [ ] Agent uses **real function calling** (not prompt chaining)
- [ ] Both parts present, run **from a clean clone** on judges' machine
- [ ] Backend real (Supabase); changes persist after reload; JSON is seed-only
- [ ] README run steps verified · `.env.example` complete · **DEMO_MODE** fallback works
- [ ] **Fork PUBLIC by 8:30 PM** · no commits after deadline
- [ ] (Bonus) Live deployed · clean, organized code

### Demo (rehearse 8:15–8:30)
- [ ] Killer flow: image→accept · edit announcement · agent knows · agent refuses student edit · History shows it all
- [ ] 3–4 sample queries live (lookup, multi-source, action, vague→asks)
- [ ] Fallback: local `npm run dev` + `DEMO_MODE=true` ready

### ⏱️ Time-box gates (with go/no-go)
- [ ] **4:10** — P0–P1 (scaffold + DB + seed) done
- [ ] **4:45** — P2 (auth+RBAC) done **OR** switch to demo-mode & move on
- [ ] **5:10** — P3 (shell) done
- [ ] **5:35** — P4 done → **Data Mgmt 20 locked**
- [ ] **6:10** — P5 done → **CRUD 20 locked** (+audit wired)
- [ ] **6:25** — P6 (History) done **OR skip if behind**
- [ ] **6:55** — P7 (🌟 Smart Entry) done **OR skip if behind**
- [ ] **7:45** — P8–P9 done → **Agent 40 locked** ← protect this above all
- [ ] **8:10** — P10 (polish) done → **UI/UX 20 locked**
- [ ] **8:20** — P11 deployed + repo public
- [ ] **8:20–8:30** — FREEZE. Rehearse. No new features.

> 🧭 **If you fall behind:** the moment a gate slips, cut the next TIER-2 item (order: P6 → P2→demo-mode → P7) and jump straight to **P8 (agent)**. The 40 agent marks + 40 data/CRUD marks + 20 UI = your guaranteed 100. Differentiators are gravy.

---

### 🔁 Prompt hygiene (Antigravity)
- Reference §4 tokens explicitly each build prompt.
- On a broken build: paste the exact error → "fix this error, keep everything else."
- Commit after every green checklist (small commits = easy rollback).
- 🧠 frontier model for: the agent tool loop, vision parsing (P7), multi-source reasoning, gnarly debugging.
- **Biggest risks:** (1) **dates** — set `DEMO_DATE` from P1's range so today/this-week/tomorrow hit data; (2) **scope** — respect the gates; (3) **judging speed** — keep `DEMO_MODE=true` ready so judges skip the approval flow.
