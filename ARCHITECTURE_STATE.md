# ARCHITECTURE_STATE.md

Living architecture memory for ilm-academy. Read first every session; update after any session that changes the codebase. Append/update — never silently delete history.

Last full ingestion: 2026-07-04 (repo @ `e29ad19`, 139 tracked files).

## Module Map

```
index.html / src/main.tsx
└── src/App.tsx ................ QueryClientProvider > TooltipProvider > Toasters > BrowserRouter > AuthProvider > Routes
    ├── src/contexts/AuthContext.tsx .... Supabase auth session + profile + roles (single context, no Redux/Zustand)
    ├── src/integrations/supabase/
    │   ├── client.ts ................... Supabase JS client (env-driven)
    │   └── types.ts .................... generated DB types
    ├── src/components/
    │   ├── ui/ ......................... shadcn/ui primitives (~50 files, stock)
    │   ├── Layout.tsx / Navbar / Footer / BottomNav / PageTransition
    │   ├── ProtectedRoute / AdminRoute / TeacherRoute .... role gates (read AuthContext.roles)
    │   └── AdminLayout / TeacherLayout / NotificationToggle
    ├── src/pages/ .................. route components (flat; student at root, admin/, teacher/)
    │   ├── Index, Login, Signup, Dashboard, Courses, CourseDetail, LessonPage, QuizPage, Profile
    │   ├── admin/ (Dashboard, Students, Teachers, Courses, Resources, LiveClasses, Analytics) + CreateCourse, UploadLesson
    │   └── teacher/ (TeacherDashboard, TeacherCourses, TeacherResources, TeacherLiveClasses)
    ├── src/hooks/ .................. use-mobile, use-toast, usePushNotifications
    ├── src/data/courses.ts ......... static seed/demo course catalog (interfaces + seedCourses)
    ├── src/lib/utils.ts ............ cn() helper
    └── src/test/ ................... setup.ts + example.test.ts (trivial placeholder only)

supabase/
├── migrations/ ................. 9 SQL migrations (PL/pgSQL convention, RLS per table)
└── functions/ .................. get-vapid-key, send-push-notification (Edge Functions)

public/ ......................... PWA assets, sw.js, offline.html, database-schema-export.sql (reference copy of full schema)
Capacitor: capacitor.config.ts + @capacitor/android (Android build; no iOS dep)
```

Data flow: pages query Supabase directly via TanStack React Query (`useQuery`/`useMutation`); grading goes through the `grade_quiz` SECURITY DEFINER RPC; auth/roles via `has_role()` + RLS.

### Database schema (verified from migrations + `public/database-schema-export.sql`)

- Enum: `app_role` (student | teacher | admin)
- Tables: `profiles`, `user_roles`, `courses`, `modules`, `lessons`, `enrollments`, `lesson_progress`, `quizzes`, `quiz_questions`, `quiz_results`, `live_classes`, `study_resources`, `teacher_courses`, `push_subscriptions`
- Functions: `has_role`, `handle_new_user` (trigger: auto-profile + student role), `update_updated_at_column`, `grade_quiz` (server-side grading, enrollment-gated, overwrites prior result), `send_upcoming_live_class_reminders`
- RLS enabled on all tables; role checks via `has_role(auth.uid(), ...)`

## Zone Classification

### CORE (touch only with explicit migration plan + tests + user confirmation)
- `src/contexts/AuthContext.tsx`, `src/components/{Protected,Admin,Teacher}Route.tsx`
- `src/integrations/supabase/client.ts` and `types.ts`
- `supabase/migrations/**` (all schema history), all RLS policies
- DB functions: `has_role`, `handle_new_user`, `grade_quiz`
- Tables holding user/progress data: `profiles`, `user_roles`, `enrollments`, `lesson_progress`, `quiz_results`

### FEATURE (extend freely once tests pass)
- `src/pages/**` (all route components), `src/components/` layout/navigation components
- `src/components/ui/**` (stock shadcn — prefer composition over modification)
- Course/module/lesson/quiz content logic; new gamification systems land here
- `supabase/functions/**` for new server-side logic (new functions additive only)

### LEGACY-FRAGILE (read-only unless refactor is explicitly requested; add tests first)
- `src/data/courses.ts` — static seed catalog that duplicates the DB course model; unclear if still rendered anywhere. Verify usage before touching.
- `public/sw.js`, `public/offline.html`, `src/hooks/usePushNotifications.ts` + push Edge Functions — untested notification chain across SW/Capacitor/Edge Function boundaries.
- `public/database-schema-export.sql` — a *snapshot*, not a migration; can drift from migrations. Never treat as source of truth over `supabase/migrations`.
- `src/test/` — only a placeholder test exists; effectively zero coverage repo-wide.

### Charter-vs-repo mismatches (flagged, not silently reconciled)
1. **No `src/features/`, `src/modules/`, or `src/utils/` directories exist**, despite README's project-structure section and the charter's instruction to home new systems there. Actual convention is flat `src/pages` + `src/components`. Decision: create `src/features/gamification/` for new systems (README already advertises this structure, so it's aligning code to stated intent) — will confirm with user before first use.
2. **Quiz system already exists** (tables, `grade_quiz` RPC, `QuizPage`), though the README roadmap lists it as a future improvement. New knowledge-challenge work must extend this, not duplicate it.
3. **No coding-sandbox scaffolding exists anywhere** (checked `supabase/functions/` and all of `src/`). Per project owner decision (2026-07-04): "sandbox coding challenges" is reinterpreted as **Islamic knowledge challenges** built on the existing quiz system. No code-execution sandbox will be built.
4. README documents `NEXT_PUBLIC_*` env var names, but this is a Vite app (`VITE_*` convention). Verify actual names in `src/integrations/supabase/client.ts` before relying on either.

## Gamification Systems Inventory

| System | Status | Owning file(s) | Notes |
|---|---|---|---|
| Quizzes / knowledge checks | **Implemented (baseline)** | `src/pages/QuizPage.tsx`, `grade_quiz` RPC, `quizzes`/`quiz_questions`/`quiz_results` | Server-graded, enrollment-gated. No attempt history (result overwritten on retry), no difficulty weighting, no hints. |
| Lesson progress tracking | **Implemented** | `lesson_progress` table, `LessonPage.tsx`, `Dashboard.tsx` | Boolean per-lesson completion; foundation for XP triggers. |
| Streaks | **Implemented (2026-07-04)** | `user_gamification` table, `record_learning_activity()`, `profiles.timezone` (added, default UTC) | Server-authoritative, timezone-aware day boundaries, atomic upsert (concurrency-safe), invalid-tz fallback to UTC. Grace display logic in `get_my_gamification` (streak shown as 0 if last activity older than yesterday). |
| XP ledger + leveling | **Implemented (2026-07-04)** | `xp_events` ledger, `user_gamification.total_xp`, `award_xp()`, `calculate_level()`, `get_my_gamification()` RPC, `useGamification` hook, `GamificationCard` | Append-oriented ledger with DB UNIQUE idempotency (user, event_type, source_id). Rewards: lesson 10 XP (trigger on completion transition), quiz_completed 15 XP once per quiz, quiz_passed 25 XP once at >=80%. Level curve: level n starts at 100*(n-1)^2 XP. Clients read-only; all writes via SECURITY DEFINER paths. |
| Knowledge challenges (reinterpreted "sandbox") | Planned | — | Extends existing quiz system: difficulty tiers, hint ladder (XP-costed), diff-style feedback. No code execution. |
| Mastery-gated unlocks (skill tree) | Planned | — | Module-level mastery threshold gating next module; builds on `modules.order_number`. |
| Achievement/share cards | Planned | — | Server-rendered (Edge Function candidate); maps to roadmap "Certificates". |
| Leaderboards / leagues | Planned | — | Opt-in only; display-name-only default (profiles currently has real `name`/`email` — needs separate `display_name`). |
| Referrals | Planned | — | Dual-sided rewards; parental-consent considerations for minors. |
| Challenge-a-friend duels | Planned | — | Async, scoped to existing contacts/classmates only (minor-safety). |
| Push notifications | **Implemented (fragile)** | `usePushNotifications.ts`, `push_subscriptions`, Edge Functions | Reusable hook for streak reminders — but LEGACY-FRAGILE; test before extending. |

## Open Risks & TODOs

1. ~~`quiz_questions.correct_answer` readable by any user~~ **FIXED 2026-07-04** (`20260704090000_secure_quiz_trust_boundary.sql`): column-level `REVOKE SELECT` + re-grant of non-answer columns to `anon`/`authenticated`. Verified live: API roles see only id/quiz_id/question/options/order_number. Teacher INSERT/UPDATE of `correct_answer` unaffected (verified: teacher UI only writes it, never reads it back).
2. `grade_quiz` deletes the prior `quiz_results` row on retake — no attempt history. Mitigated for XP: reward idempotency now lives in `xp_events` UNIQUE constraint, not in results rows. A `quiz_attempts` history table is still needed for analytics/mastery design. Additive migration needed.
3. ~~"Users can insert/update own quiz results" policies~~ **FIXED 2026-07-04** (same migration): policies dropped + table-level `REVOKE INSERT/UPDATE/DELETE` from API roles. `grade_quiz` (SECURITY DEFINER) is the only write path. Verified live.
4. Effectively zero test coverage (`example.test.ts` only). Every new system must ship its own tests; no safety net exists for regressions in existing code. Gamification invariants were verified live against the DB (see log) but have no automated tests yet.
5. `profiles.timezone` **added 2026-07-04** (default 'UTC'; no UI to set it yet — all streaks currently UTC-based until a profile setting ships). `display_name` still missing — prerequisite for privacy-safe leaderboards.
6. `src/data/courses.ts` static catalog may conflict with DB-driven courses — audit usage before building course-linked gamification UI.
7. README env-var names (`NEXT_PUBLIC_*`) likely wrong for Vite — verify against `client.ts`.
8. RTL: no `dir` handling found in `index.html`/`main.tsx`; Arabic-script gamification UI (XP bars, badges) must be built RTL-correct from the start.
9. Lovable scaffold (`lovable-tagger` devDep, `vite_react_shadcn_ts` package name) — preserve Lovable data-tagging attributes when editing existing components.

## Verification Log

### 2026-07-04 — Initial ingestion + ARCHITECTURE_STATE.md creation
- CORRECTNESS: file tree (139 files), package.json, README, all 9 migrations, schema export, App.tsx routes, AuthContext, QuizPage read directly; module map and schema section derived from those reads, not assumptions.
- SECURITY: RLS reviewed table-by-table; found `correct_answer` exposure and client-writable `quiz_results` (Open Risks #1, #3). No sandbox execution path exists to review.
- REGRESSION: no code changed this session; zone map established (mismatch: `src/features`/`src/modules` advertised but absent — flagged, not papered over).
- PEDAGOGY: confirmed existing quiz gives immediate per-question feedback and non-shaming retry copy; noted missing attempt history limits mastery/XP design.
- Residual risk: live Supabase instance not queried — schema verified from repo files only; actual deployed schema could drift from migrations.

### 2026-07-04 — Quiz trust boundary hardening + gamification foundation (XP / levels / streaks)
- Connected Supabase instance was found **empty** (fresh integration DB, zero rows in public schema). Bootstrapped it: all 9 repo migrations + schema-export snapshot applied, then two new forward-only migrations: `20260704090000_secure_quiz_trust_boundary.sql`, `20260704090100_gamification_foundation.sql`. No user data existed, so no data was at risk during bootstrap.
- CORRECTNESS: live post-migration verification queried `information_schema`/`pg_catalog` directly — column grants, table grants, function ACLs, trigger presence, and `calculate_level` outputs (0→1, 99→1, 100→2, 400→3, 900→4) all match design. `tsc --noEmit` and `vite build` pass.
- SECURITY: (a) `correct_answer` hidden from API roles via column-level privileges; (b) `quiz_results` learner write paths removed (policies dropped + privileges revoked); (c) `xp_events`/`user_gamification` are SELECT-only for clients with owner-scoped RLS; (d) `award_xp`/`record_learning_activity` have EXECUTE revoked from PUBLIC/anon/authenticated — unreachable via PostgREST; (e) XP idempotency is a DB UNIQUE constraint, not app logic — race-proof; (f) XP amounts are server constants inside SECURITY DEFINER code, never client input.
- REGRESSION: teacher quiz-creation flow audited (`TeacherCourses.tsx` writes `correct_answer`, never selects it) — unaffected. `QuizPage` already used option-only selects — unaffected. `grade_quiz` behavior preserved (same return shape, same retake semantics) with rewards appended. Client changes are additive: new hook/component + cache invalidations only. Vite config gained dev-only `allowedHosts: [".vercel.run"]` for sandbox preview (never affects production).
- PEDAGOGY: streaks reward showing up (any completion counts; no punitive reset display mid-day); quiz retries never penalize — completion XP once, mastery XP whenever 80% is first reached, so a struggling learner retrying is never worth less than one who passes first try. Copy on empty state invites rather than shames ("Complete a lesson to start a streak").
- Residual risk: `profiles.timezone` defaults to UTC with no UI to change it — streak day boundaries are UTC for everyone until a settings control ships; no automated tests for the SQL functions (verified live once, not continuously); `scripts/apply-migration.mjs` uses `rejectUnauthorized: false` (sandbox-only convenience — do not reuse in production tooling).
